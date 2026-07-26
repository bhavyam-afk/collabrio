# Collabrio — Architecture (scoped)

This revision covers **only** the four things being implemented right now:

1. Saga compensating flows for `Collaboration` approve/cancel + a real `PayoutProvider` interface
2. Corrections to wallet management (audited against the current code)
3. Analytics Worker service (producer/consumer split of the cron pipeline)
4. Identity service (extracted auth + Meta token lifecycle)

Everything else from the earlier full proposal (Catalog, Content/Media, Notification as
separate services, API gateway, Kafka/RabbitMQ, Kubernetes) is **out of scope for this pass**
and intentionally not repeated here.

All code below follows the conventions already in the repo:
- Next.js App Router route handlers (`route.ts` exporting `GET`/`POST`/`PATCH`)
- `prisma` client from `@/clients/prisma`, `authOptions` from `app/api/auth/authOptions.ts`
- `getServerSession(authOptions)` + `(session?.user as any)?.id` / `.role` for auth checks
- `NextResponse.json({ error: "..." }, { status: ... })` error shape
- `prisma.$transaction(async (tx) => { ... })` for atomic writes
- Tagged `console.log("[TAG] ...")` step logging (as in `verify/route.ts`)
- Prisma enums imported from `@prisma/client` (`PaymentStatus`, `CollabStatus`, `TransactionType`,
  `TransactionStatus`, `WalletType`)

---

## 1. Saga compensating flows — Collaboration + Payout

### 1.1 What the current code does

Three places already move money inside a single `prisma.$transaction`:

- `app/api/razorpay/payment/verify/route.ts` — brand payment → `PLATFORM_HOLD`
- `app/api/brand/content/[collabId]/route.ts` (`PATCH`, action `approve`) — escrow release → creator paid
- `app/api/brand/dashboard/route.ts` (`PATCH`, action `cancel`) — refund + optional creator compensation

This works today because everything is one Prisma transaction against one database. The moment
any of these steps needs to call an external system that can fail *after* you've already
committed part of the state (a real payout provider, in particular), a single DB transaction is
no longer enough — you need an explicit saga with a recorded compensating action.

### 1.2 New model: `SagaLog`

Add to `db/schema.prisma`, following the existing model style:

```prisma
model SagaLog {
  id          String       @id @default(cuid())
  collabId    String
  sagaType    SagaType
  step        String
  status      SagaStatus   @default(PENDING)
  payload     Json?
  error       String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([collabId])
  @@index([status])
}

enum SagaType {
  APPROVE_COLLABORATION
  CANCEL_COLLABORATION
  PAYOUT
}

enum SagaStatus {
  PENDING
  SUCCEEDED
  FAILED
  COMPENSATED
}
```

`SagaLog` is written in the **same transaction** as the state change it's protecting, so a crash
between "content marked approved" and "wallet credited" always leaves a `PENDING` row you can
find and resolve — this is the same idea as the existing `Transaction` model, just one level up
(it protects a sequence of steps, not a single wallet mutation).

### 1.3 Approve flow — corrected for idempotency + compensation

The current `approve` handler already guards against double-processing by checking
`contentStatus === "APPROVED"` **before** the transaction — but that read happens outside the
transaction, so two concurrent approve clicks can both pass the check before either commits
(a classic TOCTOU race). Fix: move the guard into the transaction as a conditional `updateMany`
and check the affected row count, matching the defensive style already used elsewhere in the
codebase (e.g. the `paymentTx?.status === COMPLETED` short-circuit in `verify/route.ts`).

```ts
// app/api/brand/content/[collabId]/route.ts — PATCH, action === "approve"

const saga = await prisma.sagaLog.create({
  data: { collabId, sagaType: "APPROVE_COLLABORATION", step: "LOCK_CONTENT", status: "PENDING" },
})

const result = await prisma.$transaction(async (tx) => {
  // Idempotency guard: only one caller can win this update
  const lock = await tx.packageCollaboration.updateMany({
    where: { collabId, contentStatus: { not: "APPROVED" } },
    data: { contentStatus: "APPROVED", draftApprovedAt: new Date() },
  })

  if (lock.count === 0) {
    // Already approved by another request — treat as success, no double payout
    return { alreadyApproved: true }
  }

  // ... existing wallet release + creator/platform wallet credit logic unchanged ...

  await tx.sagaLog.update({ where: { id: saga.id }, data: { status: "SUCCEEDED", step: "RELEASE_ESCROW" } })

  return { alreadyApproved: false, creatorShare, platformFee }
})
```

If the transaction throws (DB error, constraint violation), catch it, mark the `SagaLog` row
`FAILED`, and return `500` — the content stays `APPROVED` only if the whole transaction
committed, so there's no partial state to compensate for **within the DB**. The compensation
need only shows up once payout becomes a real external call (next section).

### 1.4 `PayoutProvider` interface

`app/api/razorpay/payout/route.ts` is currently a hard 501 stub. Wrap it behind an interface so
the KYC limitation is an explicit, swappable capability rather than dead code:

```ts
// clients/payoutProvider.ts

export interface PayoutResult {
  payoutId: string
  status: "PROCESSED" | "PENDING" | "FAILED"
}

export interface PayoutProvider {
  initiatePayout(params: {
    fundAccountId: string
    amountPaise: number
    collabId: string
  }): Promise<PayoutResult>
}

// Current implementation: not onboarded for real payouts (business KYC required)
export class RazorpayPayoutProvider implements PayoutProvider {
  async initiatePayout(): Promise<PayoutResult> {
    throw new ProviderNotOnboardedError(
      "Razorpay payouts require business KYC and fund_account onboarding — not available for this account."
    )
  }
}

export class ProviderNotOnboardedError extends Error {}
```

`app/api/razorpay/payout/route.ts` becomes:

```ts
import { RazorpayPayoutProvider, ProviderNotOnboardedError } from "@/clients/payoutProvider"

export async function POST(req: Request) {
  const provider = new RazorpayPayoutProvider()
  const saga = await prisma.sagaLog.create({
    data: { collabId, sagaType: "PAYOUT", step: "INITIATE", status: "PENDING" },
  })

  try {
    const result = await provider.initiatePayout({ fundAccountId, amountPaise, collabId })
    await prisma.sagaLog.update({ where: { id: saga.id }, data: { status: "SUCCEEDED" } })
    return NextResponse.json({ success: true, payoutId: result.payoutId })
  } catch (err) {
    // Compensating action: money was moved into creator.currentBalance when the
    // collaboration was approved — a failed payout must NOT double-debit that balance.
    // Nothing to reverse here since the payout hasn't touched the wallet yet; we only
    // record the failure so the creator can retry once a real provider is onboarded.
    await prisma.sagaLog.update({
      where: { id: saga.id },
      data: { status: "FAILED", error: err instanceof Error ? err.message : String(err) },
    })

    if (err instanceof ProviderNotOnboardedError) {
      return NextResponse.json({ error: err.message }, { status: 501 })
    }
    return NextResponse.json({ error: "Payout failed" }, { status: 500 })
  }
}
```

This preserves the existing 501 behavior for callers but now records *why* in `SagaLog`, and
gives you a real seam to plug in a KYC-complete provider later without touching call sites.

### 1.5 Payout webhook — fix a real bug found in the audit

`app/api/razorpay/webhook/route.ts`, on `payout.failed`, currently does:

```ts
await db.wallet.update({
  where: { id: tx.toWalletId! },
  data: { currentBalance: { increment: tx.amount } },
})
```

This credits `toWalletId` (the destination of the payout) on failure. A payout's `toWalletId`
represents the external bank/UPI destination, not an internal wallet — the wallet that needs its
balance **restored** on failure is `fromWalletId` (the creator or platform wallet the payout was
debited from when it was initiated). Corrected:

```ts
if (event === "payout.failed") {
  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.FAILED },
    })

    if (tx.fromWalletId) {
      await db.wallet.update({
        where: { id: tx.fromWalletId },
        data: { currentBalance: { increment: tx.amount } },
      })
    }

    await db.sagaLog.updateMany({
      where: { collabId: tx.collabId ?? undefined, sagaType: "PAYOUT", status: "PENDING" },
      data: { status: "COMPENSATED" },
    })
  })
}
```

Also add webhook signature verification (`X-Razorpay-Signature` header, same HMAC pattern
already used in `payment/verify/route.ts`) — the current webhook handler trusts the payload
unconditionally, which `razorpay.md` already flags as a known gap.

### 1.6 Cancel/refund flow — same idempotency guard

`app/api/brand/dashboard/route.ts` (`PATCH`, action `cancel`) has the same TOCTOU shape as
approve: it reads `current.PaymentStatus` before the transaction, then acts. Apply the identical
fix — a conditional `updateMany` on `Collaboration.collabStatus` inside the transaction (only
one caller can flip `ACTIVE → CANCELLED`), wrapped with a `SagaLog(sagaType: CANCEL_COLLABORATION)`
row so a partially-applied refund is always visible and retryable rather than silently stuck.

---

## 2. Wallet management — corrections needed

The wallet model and most of the money-movement code is correct. Four concrete issues found in
this audit:

### 2.1 `totalSpent` is never decremented on refund

`payment/verify/route.ts` increments `brandWallet.totalSpent` when payment is captured. But
`brand/dashboard/route.ts`'s cancel/refund path never decrements it back down. A brand who pays,
gets refunded, still shows the full amount under `totalSpent` forever. Fix — in the refund
transaction block, add:

```ts
await tx.wallet.update({
  where: { id: brandWallet.id },
  data: {
    currentBalance: { increment: brandRefund },
    totalSpent: { decrement: refundAmount },
  },
})
```

### 2.2 Platform wallet lazy-creation is duplicated and not race-safe

The exact same "find platform user, create if missing, find platform wallet, create if missing"
block is copy-pasted in `payment/verify/route.ts` and `brand/content/[collabId]/route.ts`. Both
use `findFirst` with no locking — two concurrent first-time requests can both pass the `!platformWallet`
check and both attempt `wallet.create`, and since `Wallet.userId` is `@unique`, the loser throws
an unhandled Prisma `P2002` error instead of gracefully reusing the winner's row.

Fix: extract a single idempotent helper and call it everywhere instead of duplicating the block.

```ts
// clients/platformWallet.ts
import prisma from "@/clients/prisma"
import { WalletType } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const PLATFORM_EMAIL = "platform@collabrio.local"

export async function getOrCreatePlatformWallet() {
  const existing = await prisma.wallet.findFirst({ where: { walletType: WalletType.PLATFORM } })
  if (existing) return existing

  // Upsert on the unique email so a concurrent second call reuses the same user
  // instead of racing to create a duplicate.
  const platformUser = await prisma.user.upsert({
    where: { email: PLATFORM_EMAIL },
    update: {},
    create: {
      email: PLATFORM_EMAIL,
      username: "collabrio_platform",
      passwordHash: await bcrypt.hash(process.env.PLATFORM_SEED_PASSWORD ?? "PlatformAdmin@2026", 10),
      userType: "BRAND",
      onboarding: "COMPLETE",
    },
  })

  // Wallet.userId is unique — upsert instead of create so a losing race reuses the row.
  return prisma.wallet.upsert({
    where: { userId: platformUser.id },
    update: {},
    create: {
      userId: platformUser.id,
      walletType: WalletType.PLATFORM,
      currentBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
  })
}
```

Better still, replace lazy creation entirely with a one-time entry in `db/seed.ts` (the platform
wallet should exist before the app ever serves traffic) — but keep this helper as a safety net for
existing deployments/environments where the seed hasn't run.

### 2.3 Money math should not use plain JS floats

`packagePrice = Number(collaboration.package?.price || 0)` followed by
`Math.round(packagePrice * 0.1 * 100) / 100` reads `Decimal(10,2)` into a JS `number` and does
float arithmetic. This is fine at small scale but is the classic source of penny-drift bugs at
volume. Since `@prisma/client` already exposes `Prisma.Decimal`, do the fee split with it instead:

```ts
import { Prisma } from "@prisma/client"

const packagePrice = new Prisma.Decimal(collaboration.package?.price ?? 0)
const platformFee = packagePrice.mul(0.1).toDecimalPlaces(2)
const creatorShare = packagePrice.sub(platformFee)
```

Same correction applies to the `creatorCompensation` / `brandRefund` split in the cancel flow.

### 2.4 Brand `currentBalance` is credited but never spent anywhere

On refund, `brandWallet.currentBalance` is incremented — but no route in the codebase ever reads
or debits a brand's `currentBalance` to pay for a new collaboration. Right now this field is a
dead end: money "returns" to the brand's wallet but the brand can only actually get it back
through Razorpay outside the app. Decide one of two things before shipping this:
- **(a)** Treat `currentBalance` as platform credit and let brands apply it against a future
  `payment/create` order (deduct from `currentBalance` first, only create a Razorpay order for
  the remainder), or
- **(b)** Treat it purely as a running ledger/statement figure with no in-app spend path, and
  say so explicitly in `documentations/razorpay.md` so it's a documented decision, not a
  forgotten feature.

Either is fine — leaving it undecided is the actual bug.

---

## 3. Analytics Worker service

### 3.1 What's wrong with the current cron pipeline

`app/api/cron/snapshot/route.ts` loops over every connected `CreatorSocialAccount` **serially**,
making three sequential `fetch()` calls to the Meta Graph API per creator, all inside one
function invocation. This is exactly the pattern flagged in the earlier discussion: Vercel Cron
only triggers the route on schedule — it gives you no parallelism, no per-item retry, and a
hard 10s (free) / 60s (Pro) timeout, so this will start failing once you have more than a
handful of connected creators.

### 3.2 Split into producer + worker, same file conventions

**Producer** — `app/api/cron/snapshot/route.ts` becomes a thin fan-out that keeps the existing
auth check and Prisma query, but no longer calls Meta directly:

```ts
export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await prisma.creatorSocialAccount.findMany({
    where: { platform: "INSTAGRAM", connected: true },
  })

  const jobs = await prisma.$transaction(
    accounts
      .filter((a) => a.igAccountId)
      .map((a) =>
        prisma.analyticsJob.create({
          data: { creatorId: a.creatorId, igAccountId: a.igAccountId!, status: "QUEUED" },
        })
      )
  )

  // Fan out — Vercel Queues / QStash / Redis+BullMQ, whichever you wire up; the producer
  // only needs to enqueue, never call Meta itself.
  await Promise.all(jobs.map((job) => enqueueSnapshotJob(job.id)))

  return NextResponse.json({ accountsFound: accounts.length, jobsQueued: jobs.length })
}
```

**New model**, same schema style as `CreatorSocialRawSnapshot`:

```prisma
model AnalyticsJob {
  id          String             @id @default(cuid())
  creatorId   String
  igAccountId String
  status      AnalyticsJobStatus @default(QUEUED)
  attempts    Int                @default(0)
  error       String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@index([status])
  @@index([creatorId])
}

enum AnalyticsJobStatus {
  QUEUED
  PROCESSING
  SUCCEEDED
  FAILED
}
```

**Worker** — a new route, `app/api/analytics-worker/snapshot/route.ts`, invoked per job by the
queue consumer (not by Vercel Cron directly). It keeps the exact same three Meta Graph API calls
and `debug` logging pattern already in the current `snapshot` route — the only thing that
changes is scope: one job = one creator, so a failed/expired token for one creator can't block
or slow down anyone else's snapshot, and each job gets its own retry with backoff (`attempts++`
on `AnalyticsJob`, capped at e.g. 3, then marked `FAILED` for manual review):

```ts
export async function POST(req: Request) {
  const { jobId } = await req.json()
  const job = await prisma.analyticsJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  })

  try {
    // ... identical profile/dailyInsights/totalInsights fetch + creatorSocialRawSnapshot.create
    //     logic as the current app/api/cron/snapshot/route.ts, unchanged ...

    await prisma.analyticsJob.update({ where: { id: jobId }, data: { status: "SUCCEEDED" } })
  } catch (err) {
    await prisma.analyticsJob.update({
      where: { id: jobId },
      data: {
        status: job.attempts + 1 >= 3 ? "FAILED" : "QUEUED",
        attempts: { increment: 1 },
        error: err instanceof Error ? err.message : String(err),
      },
    })
  }

  return NextResponse.json({ ok: true })
}
```

`app/api/cron/populate/route.ts` keeps its exact current logic (it already reads from
`CreatorSocialRawSnapshot`, which is unaffected by this change) — it can stay a simple cron route
since aggregation across all creators from already-fetched data is fast and doesn't call any
external API. Only the Meta-calling half needed the queue.

### 3.3 What to actually use for the queue

Two options, pick one and state it in `vercel.json`/README once decided:
- **Vercel Queues** — if you want to stay fully on Vercel's stack with minimal new infra.
- **Redis + BullMQ** (self-hosted, e.g. Upstash Redis for the connection) — more resume weight,
  same amount of code either way for this scope.

---

## 4. Identity service

### 4.1 What moves

Everything currently under `app/api/auth/` and `app/api/onboarding/`:
- `app/api/auth/[...nextauth]/route.ts`, `app/api/auth/authOptions.ts`
- `app/api/auth/signup/route.ts`
- `app/api/onboarding/brand/route.ts`, `app/api/onboarding/creator/route.ts`
- `app/api/auth/meta/callback/route.ts`, `app/api/creator/[id]/creator-social-account/route.ts`

The session shape returned to the client **must not change** — `session.user.id`, `.email`,
`.username`, `.role`, `.onboarding` are consumed by every other route via
`(session?.user as any)?.id` / `.role`, so any extraction has to preserve this contract exactly.

### 4.2 Fix found during audit: Meta tokens are never refreshed

`documentations/meta.md` already flags this: `tokenExpiresAt` is stored but nothing reads it.
Add a scheduled check (same `CRON_SECRET`-gated pattern as the other cron routes) that the
Identity service owns:

```ts
// app/api/cron/meta-token-refresh/route.ts
export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const expiringSoon = await prisma.creatorSocialAccount.findMany({
    where: {
      platform: "INSTAGRAM",
      connected: true,
      tokenExpiresAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // < 7 days left
    },
  })

  for (const account of expiringSoon) {
    // Long-lived tokens can be re-extended via the same
    // grant_type=fb_exchange_token call already used in auth/meta/callback/route.ts
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
          `?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${account.accessToken}`
      )
      const data = await res.json()
      if (data.access_token) {
        await prisma.creatorSocialAccount.update({
          where: { id: account.id },
          data: {
            accessToken: data.access_token,
            tokenExpiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000),
          },
        })
      }
    } catch (err) {
      console.error("[META_REFRESH] failed for", account.creatorId, err)
      // Connection lapses silently today; consider setting connected: false after N failures
      // and publishing a notification so the creator is prompted to reconnect.
    }
  }

  return NextResponse.json({ checked: expiringSoon.length })
}
```

This directly fixes the failure mode `documentations/cron.md` already calls out: "if a Meta
token is expired or invalid, the snapshot job will fail for that account" — this closes that gap
instead of requiring the creator to notice and manually reconnect.

### 4.3 Auth/session boundary for the split

Keep NextAuth's JWT strategy exactly as-is (`session: { strategy: "jwt" }`, same
`NEXTAUTH_SECRET`). Other services validate the same JWT locally (NextAuth JWTs are just signed
tokens — any service holding `NEXTAUTH_SECRET` can verify them with `next-auth/jwt`'s `getToken`)
rather than calling back into Identity on every request. This keeps the exact current
`getServerSession(authOptions)` call sites working unchanged in routes that stay in the main app,
and gives extracted services a lightweight way to check `role`/`onboarding` without a network
hop per request.

---

## 5. Summary of new schema additions

```prisma
model SagaLog { ... }        // section 1.2
enum SagaType { ... }
enum SagaStatus { ... }

model AnalyticsJob { ... }   // section 3.2
enum AnalyticsJobStatus { ... }
```

No existing model or enum is renamed or removed — every fix above is additive or corrects logic
inside an existing route, so the current frontend, `documentations/*.md`, and test accounts in
`README.md` keep working without changes.
