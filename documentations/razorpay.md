
# Razorpay Integration — Technical Reference

This document describes how Collabrio integrates with Razorpay for payments, which Razorpay services the app uses, and how our backend routes implement the payment lifecycle. It also covers the implemented escrow logic, content delivery checks, and notes on payouts and webhooks.

## Razorpay services used

- Orders API (razorpay.orders.create)
   - We create an order on behalf of a collaboration to initiate checkout. Order amount uses package price (in INR, paise).
- Payment verification (HMAC SHA256 signature)
   - After frontend checkout, Razorpay returns payment_id, order_id, and signature. The backend validates the signature using RAZORPAY_KEY_SECRET.
- Transfers / Payouts (razorpay.transfers)
   - Mentioned in code but intentionally disabled in this demo. Real payouts require fund_account onboarding and platform KYC.
- Webhooks
   - We listen for payout events in `app/api/razorpay/webhook/route.ts` to reconcile transfer status. Other webhook events (payment.authorized etc.) can be supported.

## Environment variables

- `RAZORPAY_KEY_ID` — server API key id
- `RAZORPAY_KEY_SECRET` — server API secret (used to verify signatures)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — exposed to frontend to initialize Razorpay checkout
- `RAZORPAY_ACCOUNT_NUMBER` — used for transfer configuration (not used in demo)

## Routes and how they map to payment flow

All payment code lives under `app/api/razorpay/`.

1. `POST /api/razorpay/payment/create` (file: `app/api/razorpay/payment/create/route.ts`)
    - Purpose: create a Razorpay order for a collaboration when a brand chooses to pay.
    - Auth: brand only (validated with `getServerSession` and `authOptions`).
    - Checks:
       - Collaboration exists and belongs to the requesting brand.
       - Collaboration status must be `ACTIVE` (creator accepted request).
       - Avoid creating duplicate orders: reuses pending order if present.
    - Actions:
       - Calls `razorpay.orders.create({ amount, currency, receipt, notes })`.
       - Stores a `Transaction` with `type: BRAND_PAYMENT, status: PENDING, externalOrderId: order.id`.
    - Response: `{ orderId, amount, currency }` for frontend to open checkout.

2. `POST /api/razorpay/payment/verify` (file: `app/api/razorpay/payment/verify/route.ts`)
    - Purpose: verify payment after frontend checkout and move funds into platform escrow.
    - Inputs: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, collabId }`.
    - Verification:
       - Recomputes HMAC SHA256 signature: `HMAC(RAZORPAY_KEY_SECRET, order_id|payment_id)` and compares.
       - If signature mismatch → 400 error.
    - Actions (atomic transaction):
       - Create or update `Transaction` to `COMPLETED` with `externalPaymentId`.
       - Update platform wallet `pendingBalance` by package price (escrow).
       - Increment brand wallet `totalSpent`.
       - Set `Collaboration.PaymentStatus = PLATFORM_HOLD`.
       - Upsert `PackageCollaboration` with `PaymentStatus = BRAND_PAID` and `contentStatus = NOT_SUBMITTED`.
    - Response: `{ success: true }`.

3. `POST /api/uploads/creatordraft` (file: `app/api/uploads/creatordraft/route.ts`)
    - Purpose: allow creator to upload draft content.
    - Checks:
       - Creator authenticated and owns the collaboration.
       - `collab.collabStatus === ACTIVE`.
       - `PackageCollaboration.PaymentStatus` must be `BRAND_PAID` or `PLATFORM_HOLD` (ensures brand has paid and funds are escrowed).
    - Actions:
       - Uploads file to S3 using `uploadToS3` and stores S3 key/url.
       - Creates or updates `PackageCollaboration.contentDraft` and sets `contentStatus = SUBMITTED` and `draftSubmittedAt`.
    - Response: includes `fileUrl`, `previewUrl` and updated content metadata.

4. `PATCH /api/brand/content/[collabId]` (file: `app/api/brand/content/[collabId]/route.ts`)
    - Purpose: brand reviews and approves or requests improvements.
    - Actions on `approve`:
       - Require content submitted.
       - Marks `PackageCollaboration.contentStatus = APPROVED` and sets `PaymentStatus = CREATOR_PAID`.
       - Marks `Collaboration.collabStatus = COMPLETED` and `PaymentStatus = CREATOR_PAID`.
       - Performs wallet transfers (atomic): release escrow (decrement platform pendingBalance), credit creator wallet (creator share), credit platform fee.
       - Creates transactions for creator earning and platform fee.
    - Actions on `request_improvement`:
       - Marks `PackageCollaboration.contentStatus = IMPROVEMENT_REQUESTED`, increments `revisionCount`, stores `brandFeedback`.
       - Keeps funds locked (`PaymentStatus = PLATFORM_HOLD`) so creator is not paid until approval.

5. `POST /api/razorpay/payout` (file: `app/api/razorpay/payout/route.ts`)
    - Purpose in principle: initiate transfers from platform to creator bank/UPI using Razorpay transfers API.
    - Current state in this repo: intentionally disabled — the route returns 501 (Not Implemented) with an explanation.
    - Reason: payouts require storing `fund_account_id` for beneficiaries and platform KYC; not appropriate for the college demo.

6. `POST /api/razorpay/webhook` (file: `app/api/razorpay/webhook/route.ts`)
    - Purpose: reconcile external transfer/payout events.
    - Implemented handlers:
       - `payout.processed` → mark `Transaction.status = COMPLETED`.
       - `payout.failed` → mark `Transaction.status = FAILED` and roll back funds to the recipient wallet (simple compensation).
    - Note: Webhook signing verification is recommended for production but not present in the demo.

## Escrow and wallet model

- Brand pays via Razorpay → we record a `BRAND_PAYMENT` transaction and mark it `COMPLETED` on verification.
- Funds are held in the platform wallet `pendingBalance` until the brand approves the content.
- On approval, platform releases escrow: `pendingBalance` decremented, creator `currentBalance` incremented (creator receives 90% by current logic), platform receives fee (10%).
- On cancellation before approval, refunds are processed: platform pending balance decremented and brand wallet credited; creator may receive partial compensation if drafts were submitted.

## Decisions and rationale

- Payouts disabled: to avoid collecting or processing real beneficiary data (fund_account_id) and because platform-level KYC is out-of-scope for a college project.
- Webhooks: included a basic handler for payout events to reconcile transactions — in production you should verify webhook signatures and handle more events (payment.authorized, payment.failed, order.*) and idempotency.

## Security notes and recommendations

- Keep `RAZORPAY_KEY_SECRET` only on server-side and never expose it in client bundles.
- Verify Razorpay signatures on payment verify and webhooks.
- Implement idempotency for order creation and webhook processing.
- Add monitoring/alerts for failed transfers and reconciliation issues.

## Where to look in the codebase

- `app/api/razorpay/payment/create/route.ts` — create order
- `app/api/razorpay/payment/verify/route.ts` — verify payment and move funds to escrow
- `app/api/uploads/creatordraft/route.ts` — creator upload flow (requires funds in escrow)
- `app/api/brand/content/[collabId]/route.ts` — approve / request improvement and release escrow
- `app/api/razorpay/payout/route.ts` — payout route (501 stub in demo)
- `app/api/razorpay/webhook/route.ts` — simple webhook handler for payout events
- `documentations/RAZORPAY_SETUP.md` — setup and local env guidance

---


This is a completely separate flow.
Payment status DOES NOT change.

It remains:

```text
PaymentStatus = CREATOR_PAID
```

because the creator already owns the money.

---


# Refund Flow
## Scenario

Brand paid.

Creator has not submitted work.

Brand cancels.

---

## Collaboration

```text
CollabStatus = CANCELLED
```

---

## Payment

```text
PaymentStatus = REFUNDED
```

---

## Transaction

```text
TransactionType   = REFUND
TransactionStatus = COMPLETED
```

---

## Wallet Updates

```text
platform.pendingBalance -= amount
```

Money returned to brand.

---

# State Machines

## Collaboration Lifecycle

```text
PENDING
   ↓
ACTIVE
   ↓
COMPLETED
```

or

```text
PENDING
   ↓
CANCELLED
```

or

```text
ACTIVE
   ↓
CANCELLED
```

---

## Content Lifecycle

```text
NOT_SUBMITTED
        ↓
SUBMITTED
        ↓
IMPROVEMENT_REQUESTED
        ↓
SUBMITTED
        ↓
APPROVED
```

---

## Payment Lifecycle

Happy Path:

```text
UNPAID
   ↓
BRAND_PAID
   ↓
PLATFORM_HOLD
   ↓
CREATOR_PAID
```

Refund Path:

```text
UNPAID
   ↓
BRAND_PAID
   ↓
PLATFORM_HOLD
   ↓
REFUNDED
```

---

# Wallet Responsibilities

## Brand Wallet

Tracks:

```text
totalSpent
```

---

## Platform Wallet

Tracks: The platform wallet is the single source of truth for escrowed funds.

```text
pendingBalance
currentBalance
totalEarned
```

pendingBalance acts as escrow.

---

## Creator Wallet

Tracks:

```text
currentBalance
totalEarned
```

Creator withdraws from currentBalance.
