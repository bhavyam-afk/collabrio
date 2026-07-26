# Distributed Systems Migration — Summary of Changes

> Generated on 2026-07-27. Covers the 4-phase migration from monolithic full-stack to distributed architecture.

---

## Why This Migration

Collabrio was a single Next.js app where every operation (payment, approval, analytics) ran in one process against one database transaction. This works at small scale but breaks the moment you need:

- **External system calls that can fail mid-operation** (payouts, webhooks) — a single DB transaction can't protect you
- **Parallel processing** — the cron route called Meta's API serially for every creator, hitting Vercel's timeout
- **Independent failure isolation** — one creator's expired token shouldn't block every other creator's analytics

This migration adds **saga compensating flows**, **a BullMQ job queue**, **idempotency guards**, and **proactive token refresh** — the foundational pieces for a distributed system.

---

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| (none) | - | No external queue dependencies needed (switched to serverless push model) |

## New Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `REDIS_URL` | Yes (for analytics worker) | Redis connection string (e.g. `redis://localhost:6379` or Upstash URL) |
| `RAZORPAY_WEBHOOK_SECRET` | Recommended | Webhook signature verification HMAC secret |
| `PLATFORM_SEED_PASSWORD` | Optional | Platform system user password (defaults to `PlatformAdmin@2026`) |

---

## New Files Created (5)

### 1. `clients/payoutProvider.ts`
**Purpose:** Swappable payout abstraction.

Defines a `PayoutProvider` interface with `initiatePayout()` method, plus a `RazorpayPayoutProvider` that throws `ProviderNotOnboardedError` (since real payouts require business KYC). When KYC is complete, swap in a real implementation without touching any call sites.

### 2. `clients/platformWallet.ts`
**Purpose:** Race-safe platform wallet creation.

The old code had the same "find platform user → create if missing → find wallet → create if missing" block copy-pasted in two routes, using `findFirst` + `create`. Two concurrent first-time requests could both pass the `!wallet` check and race to `create`, causing a Prisma P2002 unique constraint error.

This helper uses `upsert` on the unique `email` and `userId` columns — the loser reuses the winner's row instead of crashing.

### 3. `clients/analyticsQueue.ts`
**Purpose:** Serverless-native push queue for analytics snapshots.

- **Queue:** Replaced BullMQ with a simple concurrency-limited HTTP caller that runs within the Vercel cron execution window.
- **Worker:** Pushes jobs directly to the `/api/analytics-worker/snapshot` endpoint in batches of 5.
- **Tracking:** Relies on the worker route to update `AnalyticsJob` status (QUEUED → PROCESSING → SUCCEEDED/FAILED) in the database.

### 4. `app/api/analytics-worker/snapshot/route.ts`
**Purpose:** HTTP endpoint for per-job analytics processing.

Acts as an alternative entry point for the worker logic (same Meta API calls). Protected by `CRON_SECRET`. Provides independent retry tracking per creator.

### 5. `app/api/cron/meta-token-refresh/route.ts`
**Purpose:** Proactive Meta token refresh.

Runs daily at midnight UTC (before the 1am snapshot cron). Finds all connected Instagram accounts with tokens expiring within 7 days and re-extends them using the `fb_exchange_token` grant. Closes the documented gap where expired tokens silently broke analytics collection.

---

## Modified Files (8)

### 1. `db/schema.prisma`
**Added 2 models + 4 enums:**

```prisma
model SagaLog       — tracks multi-step operation lifecycle (PENDING → SUCCEEDED/FAILED/COMPENSATED)
enum SagaType        — APPROVE_COLLABORATION, CANCEL_COLLABORATION, PAYOUT
enum SagaStatus      — PENDING, SUCCEEDED, FAILED, COMPENSATED

model AnalyticsJob   — tracks per-creator snapshot jobs for the queue
enum AnalyticsJobStatus — QUEUED, PROCESSING, SUCCEEDED, FAILED
```

No existing models were modified or removed.

---

### 2. `app/api/brand/content/[collabId]/route.ts` (Approve Flow)

**3 fixes applied:**

| Fix | Before | After |
|-----|--------|-------|
| **TOCTOU race** | Idempotency check (`contentStatus === "APPROVED"`) ran outside the transaction — two concurrent clicks could both pass it | Moved inside transaction using `updateMany` with `where: { contentStatus: { not: "APPROVED" } }` — only one caller wins |
| **Float math** | `Number(price)` + `Math.round(price * 0.1 * 100) / 100` — classic penny-drift source | `Prisma.Decimal` arithmetic: `packagePrice.mul("0.1").toDecimalPlaces(2)` |
| **Platform wallet race** | 30+ lines of inline `findFirst` + `create` (duplicated from verify route) | Single call to `getOrCreatePlatformWallet()` |

**Added:** `SagaLog` row created before transaction, marked SUCCEEDED on commit, FAILED on error.

---

### 3. `app/api/brand/dashboard/route.ts` (Cancel/Refund Flow)

**4 fixes applied:**

| Fix | Before | After |
|-----|--------|-------|
| **TOCTOU race** | `collabStatus` check ran outside transaction | Moved inside using `updateMany` with `where: { collabStatus: "ACTIVE" }` |
| **`totalSpent` never decremented** | Brand refund credited `currentBalance` but never reduced `totalSpent` — refunded brands showed inflated spending | Added `totalSpent: { decrement: refundAmount }` to brand wallet update |
| **Float math** | `Number(price)` + `Math.round(...)` | `Prisma.Decimal` arithmetic |
| **Saga logging** | None | `SagaLog(sagaType: CANCEL_COLLABORATION)` wraps the refund transaction |

---

### 4. `app/api/razorpay/payout/route.ts`

**Before:** Hard-coded 501 stub with an inline error message.

**After:** Uses `PayoutProvider` interface + `SagaLog`:
- Creates saga row before attempting payout
- Calls `provider.initiatePayout()` (currently throws `ProviderNotOnboardedError`)
- Records success/failure in `SagaLog`
- Returns the same 501 to callers — no breaking change

---

### 5. `app/api/razorpay/webhook/route.ts`

**2 critical fixes:**

| Fix | Before | After |
|-----|--------|-------|
| **Bug: wrong wallet on payout.failed** | Credited `toWalletId` (external bank/UPI destination) | Credits `fromWalletId` (the source wallet the payout was debited from) |
| **No signature verification** | Trusted payload unconditionally | Verifies `X-Razorpay-Signature` HMAC using `RAZORPAY_WEBHOOK_SECRET` |

**Added:** `SagaLog` compensation tracking — marks pending payout sagas as COMPENSATED on failure.

---

### 6. `app/api/razorpay/payment/verify/route.ts`

**1 fix:** Replaced 30+ lines of inline platform wallet/user creation with `getOrCreatePlatformWallet()`. Removed unused `bcrypt` import.

---

### 7. `app/api/cron/snapshot/route.ts`

**Before:** Serial loop calling Meta's Graph API for every connected creator (3 `fetch()` calls per creator, all blocking, Vercel timeout risk).

**After:** Thin fan-out producer:
1. Queries all connected Instagram accounts (unchanged)
2. Creates `AnalyticsJob` rows in a batch transaction
3. Enqueues each job to BullMQ
4. Returns immediately with `{ accountsFound, jobsQueued }`

The actual API calls now happen in the BullMQ worker with 5x concurrency and independent retry per creator.

---

### 8. `vercel.json`

Added meta-token-refresh cron:
```json
{ "path": "/api/cron/meta-token-refresh", "schedule": "0 0 * * *" }
```
Runs at midnight UTC — 1 hour before the snapshot cron at 1am — so tokens are refreshed before snapshots try to use them.

---

## Database Migration Required

After accepting these changes, run:
```bash
npx prisma migrate dev --schema=db/schema.prisma --name distributed_systems
```

This creates the `SagaLog` and `AnalyticsJob` tables. No existing tables are altered.

---

## Files NOT Modified

All of these are explicitly unchanged:
- `app/api/auth/*` — auth flow, session shape, JWT strategy
- `app/api/onboarding/*` — brand/creator onboarding
- `app/api/creator/*` — creator profile, dashboard, packages, content
- `app/api/cron/populate/route.ts` — aggregation cron (reads from `CreatorSocialRawSnapshot`, unaffected)
- `clients/prisma.ts`, `clients/s3.ts`, `clients/uploadToS3.ts` — existing clients
- All frontend components and pages
- `db/seed.ts` — seed data
