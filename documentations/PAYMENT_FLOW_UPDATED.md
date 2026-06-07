# Collabrio Payment Flow — Updated Implementation

## Overview
Complete payment tracking with `PaymentStatus` enum changes at each step. All enums properly tracked through collaboration, content, transactions, and wallets.

---

## Happy Path: Step-by-Step

### Step 1: Brand Sends Invitation
**Route:** `POST /api/brand/discover`

```
Collaboration created:
  collabStatus = PENDING
  PaymentStatus = UNPAID (default)

PackageCollaboration:
  NOT created yet
```

---

### Step 2: Creator Accepts Invitation
**Route:** `PATCH /api/creator/dashboard`

```
Collaboration updated:
  collabStatus = PENDING → ACTIVE

PackageCollaboration created:
  contentStatus = NOT_SUBMITTED
  PaymentStatus = UNPAID (default)
```

---

### Step 3: Brand Initiates Payment
**Route:** `POST /api/razorpay/payment/create`

Creates order in Razorpay, transaction stays PENDING.

```
Transaction created:
  type = BRAND_PAYMENT
  status = PENDING
  
PaymentStatus: Still UNPAID
```

---

### Step 4: Brand Completes Payment (Razorpay)
**Route:** `POST /api/razorpay/payment/verify`

✅ **Key changes implemented here:**

```
Transaction updated/created:
  type = BRAND_PAYMENT
  status = PENDING → COMPLETED
  externalPaymentId = razorpay_payment_id
  externalOrderId = razorpay_order_id

Wallet updates:
  platform.pendingBalance += amount    (escrow lock)
  brand.totalSpent += amount

Collaboration updated:
  PaymentStatus = UNPAID → PLATFORM_HOLD

PackageCollaboration upserted:
  PaymentStatus = UNPAID → PLATFORM_HOLD
  contentStatus = NOT_SUBMITTED (unchanged)
```

**State at this point:**
- Money locked in platform escrow (pendingBalance)
- Creator has not earned anything yet
- Content not yet submitted
- Brand cannot withdraw (payment is escrowed)

---

### Step 5: Creator Uploads Draft
**Route:** `POST /api/uploads/creatordraft`

✅ **Verifications:**
- Checks `collabStatus = ACTIVE`
- Checks `PaymentStatus = PLATFORM_HOLD` (payment locked in escrow)
- Verifies `BRAND_PAYMENT` transaction is COMPLETED

```
PackageCollaboration updated:
  contentStatus = NOT_SUBMITTED → SUBMITTED
  contentDraft = [files...]
  draftSubmittedAt = now
  
PaymentStatus: Stays PLATFORM_HOLD (escrow still locked)
```

---

### Step 6: Brand Requests Changes (Optional)
**Route:** `PATCH /api/brand/content/[collabId]` with `action=request_improvement`

```
PackageCollaboration updated:
  contentStatus = SUBMITTED → IMPROVEMENT_REQUESTED
  brandFeedback = feedback
  revisionCount += 1
  
PaymentStatus: Stays PLATFORM_HOLD (escrow remains locked)
```

Creator can resubmit → back to Step 5

---

### Step 7: Creator Resubmits (Optional)
**Route:** `POST /api/uploads/creatordraft`

```
PackageCollaboration updated:
  contentStatus = IMPROVEMENT_REQUESTED → SUBMITTED
  revisionCount: unchanged
  
PaymentStatus: Stays PLATFORM_HOLD
```

Back to Step 6 or Step 8

---

### Step 8: Brand Approves Content
**Route:** `PATCH /api/brand/content/[collabId]` with `action=approve`

✅ **Key changes implemented here:**

This is the escrow release event:

```
PackageCollaboration updated:
  contentStatus = SUBMITTED → APPROVED
  PaymentStatus = PLATFORM_HOLD → CREATOR_PAID
  draftApprovedAt = now

Collaboration updated:
  collabStatus = ACTIVE → COMPLETED
  PaymentStatus = PLATFORM_HOLD → CREATOR_PAID

Wallet updates (assume 10% platform fee):
  platform.pendingBalance -= totalAmount
  
  creator.currentBalance += creatorShare (90%)
  creator.totalEarned += creatorShare
  
  platform.currentBalance += platformFee (10%)
  platform.totalEarned += platformFee

Transactions created:
  1) CREATOR_EARNING
     status = INWALLET
     amount = creatorShare
     fromWallet = platform
     toWallet = creator
     
  2) PLATFORM_FEE
     status = COMPLETED
     amount = platformFee
     fromWallet = platform (fee earned by platform)
     toWallet = platform
```

**State at this point:**
- Creator owns the earnings in their wallet (INWALLET)
- Creator can now withdraw
- Escrow has been released
- Collaboration is complete from content side

---

### Step 9: Creator Withdraws (Optional, Separate Flow)
**Route:** `POST /api/razorpay/payout`

✅ Already implemented in existing code:

```
Transaction created:
  type = PAYOUT
  status = PENDING
  externalPaymentId = transfer_id

Wallet: unchanged (creator still owns the money)

PaymentStatus: Stays CREATOR_PAID (unchanged)
  - Because creator already owns the money
  - Withdrawal is just moving money from wallet to bank
```

**On Razorpay Webhook (payout.processed):**

```
Transaction updated:
  status = PENDING → COMPLETED

Wallet updated:
  creator.currentBalance -= withdrawAmount
```

---

## Refund Path

### Scenario: Brand Paid, Creator Not Paid Yet, Brand Cancels
**Route:** `PATCH /api/brand/dashboard` with `action=cancel`

✅ **Key changes implemented here:**

```
State check:
  collabStatus = ACTIVE
  PaymentStatus = PLATFORM_HOLD
  (if CREATOR_PAID: cannot cancel)

Collaboration updated:
  collabStatus = ACTIVE → CANCELLED
  PaymentStatus = PLATFORM_HOLD → REFUNDED

PackageCollaboration updated:
  PaymentStatus = PLATFORM_HOLD → REFUNDED

Wallet updates:
  platform.pendingBalance -= amount (release escrow)
  (Money goes back to brand via Razorpay)

Transaction created:
  type = REFUND
  status = COMPLETED
  amount = totalAmount
  fromWallet = platform
  toWallet = brand
```

---

## Withdraw Path (PENDING Collaboration)

### Scenario: Brand Sent Invite, Creator Didn't Accept, Brand Withdraws
**Route:** `PATCH /api/brand/dashboard` with `action=withdraw`

```
State check:
  collabStatus = PENDING
  PaymentStatus = UNPAID (no payment yet)

Collaboration updated:
  collabStatus = PENDING → CANCELLED
  
No wallets touched.
No refund needed.
```

---

## State Machine Matrices

### Collaboration Status Transitions
```
PENDING
  ├→ ACTIVE (creator accepts)
  ├→ CANCELLED (brand withdraws)
  
ACTIVE
  ├→ COMPLETED (brand approves content)
  ├→ CANCELLED (brand cancels, if not CREATOR_PAID)
  
COMPLETED
  └→ (terminal state)
  
CANCELLED
  └→ (terminal state)
```

### PaymentStatus Transitions (via Collaboration)
```
UNPAID
  └→ BRAND_PAID
     ├→ PLATFORM_HOLD
     │  ├→ CREATOR_PAID (approve)
     │  └→ REFUNDED (cancel)
     │
     └→ (no current implementation for BRAND_PAID alone)

CREATOR_PAID
  └→ (terminal — creator owns money, can't be reversed)

REFUNDED
  └→ (terminal)
```

### ContentStatus Transitions (via PackageCollaboration)
```
NOT_SUBMITTED
  └→ SUBMITTED (creator uploads)
     ├→ IMPROVEMENT_REQUESTED (brand requests changes)
     │  └→ SUBMITTED (creator resubmits)
     │     └→ ... (cycle back to IMPROVEMENT_REQUESTED or APPROVED)
     │
     └→ APPROVED (brand approves)
        └→ (terminal)
```

### TransactionStatus Lifecycle
```
PENDING (order created, awaiting payment)
├→ COMPLETED (payment received / payout successful)
├→ FAILED (payment failed / payout failed)
└→ INWALLET (creator earned, sitting in wallet, not yet withdrawn)
```

### TransactionType for Each Event
```
BRAND_PAYMENT       — Brand pays platform (Razorpay)
CREATOR_EARNING     — Platform credits creator (on approval)
PLATFORM_FEE        — Platform keeps commission
PAYOUT              — Creator withdraws to bank
REFUND              — Brand gets refund on cancellation
```

---

## Key Invariants

### Never Violate These
1. **Escrow Lock**
   - Once `PaymentStatus = PLATFORM_HOLD`, money cannot move until either CREATOR_PAID or REFUNDED

2. **Creator Earnings**
   - Only created when `contentStatus = APPROVED` AND `collabStatus = COMPLETED`

3. **Platform Fee**
   - Always taken when creator is paid
   - Default: 10% of package price

4. **No Reversal After CREATOR_PAID**
   - Once creator has earnings, cannot refund
   - Collaboration is locked

5. **Withdrawal Independence**
   - Creator withdraw doesn't change `PaymentStatus`
   - PAYOUT transaction is separate from CREATOR_EARNING

---

## Database Queries For Verification

### Check Payment State
```prisma
const collab = await prisma.collaboration.findUnique({
  where: { id: collabId },
  include: {
    content: true,
    package: true,
  }
})

// Check:
// collab.collabStatus
// collab.PaymentStatus
// collab.content.contentStatus
// collab.content.PaymentStatus
// collab.package.price
```

### Check Wallets
```prisma
const platform = await prisma.wallet.findFirst({
  where: { walletType: "PLATFORM" }
})

// platform.currentBalance — earned and available
// platform.pendingBalance — escrowed, not yet earned
// platform.totalEarned — lifetime earnings
```

### Check Transactions
```prisma
const txs = await prisma.transaction.findMany({
  where: { collabId },
  orderBy: { createdAt: "asc" }
})

// Should see sequence:
// 1. BRAND_PAYMENT (COMPLETED)
// 2. CREATOR_EARNING (INWALLET) — if approved
// 3. PLATFORM_FEE (COMPLETED) — if approved
// 4. PAYOUT (PENDING/COMPLETED) — if creator withdraws
```

---

## API Response Examples

### After Payment Verified
```json
{
  "success": true
}
```

Backend state:
- Collaboration.PaymentStatus = PLATFORM_HOLD
- PackageCollaboration.PaymentStatus = PLATFORM_HOLD
- Platform wallet pendingBalance increased

---

### After Brand Approves
```json
{
  "success": true,
  "contentStatus": "APPROVED",
  "paymentReleased": true,
  "creatorEarnings": 4500,
  "platformFee": 500
}
```

Backend state:
- All wallets updated
- Transactions created
- Collaboration.PaymentStatus = CREATOR_PAID

---

### On Cancellation with Refund
```json
{
  "collaboration": { ... },
  "refundProcessed": true,
  "refundAmount": 5000
}
```

Backend state:
- Collaboration.PaymentStatus = REFUNDED
- Platform escrow released
- REFUND transaction created

---

## Routes Implemented/Updated

### Payment Flow
- ✅ `POST /api/razorpay/payment/create` — Create order
- ✅ `POST /api/razorpay/payment/verify` — Verify & lock escrow
- ✅ `POST /api/razorpay/payout` — Initiate withdrawal
- ✅ `POST /api/razorpay/webhook` — Handle payout webhooks

### Collaboration
- ✅ `POST /api/brand/discover` — Invite creator
- ✅ `PATCH /api/creator/dashboard` — Accept invitation
- ✅ `PATCH /api/brand/dashboard` — Withdraw or cancel with refund logic

### Content & Approval
- ✅ `POST /api/uploads/creatordraft` — Upload with payment verification
- ✅ `GET /api/brand/content/[collabId]` — View with PaymentStatus
- ✅ `PATCH /api/brand/content/[collabId]` — Approve (escrow release) or request improvements
- ✅ `GET /api/creator/content/[collabId]` — View with PaymentStatus

---

## Testing Checklist

### Happy Path
- [ ] Brand invites creator
- [ ] Creator accepts
- [ ] Brand pays via Razorpay
- [ ] Verify: `PaymentStatus = PLATFORM_HOLD`, `pendingBalance > 0`
- [ ] Creator uploads content
- [ ] Brand approves
- [ ] Verify: `PaymentStatus = CREATOR_PAID`, creator wallet updated, escrow released
- [ ] Creator withdraws
- [ ] Verify: `currentBalance` decreased, payout transaction created

### Improvement Requests
- [ ] Repeat from "Brand requests changes"
- [ ] Creator resubmits
- [ ] Brand approves again
- [ ] Verify: Only one CREATOR_EARNING + PLATFORM_FEE created

### Refund Path
- [ ] Brand pays → `PaymentStatus = PLATFORM_HOLD`
- [ ] Brand cancels before approval
- [ ] Verify: `PaymentStatus = REFUNDED`, escrow released, REFUND transaction created

### Edge Cases
- [ ] Cannot cancel after `CREATOR_PAID`
- [ ] Cannot upload before payment verified
- [ ] Cannot request improvement on non-submitted content
- [ ] Multiple revisions don't create multiple earnings

---

## Fee Configuration

Currently hardcoded:
```typescript
const platformFeePercent = 0.1 // 10%
const platformFee = Math.round(packagePrice * platformFeePercent * 100) / 100
const creatorShare = packagePrice - platformFee
```

**Future:** Make configurable via environment or brand subscription plan.

---

## Conclusion

All `PaymentStatus` enum transitions are now properly tracked through:
1. Collaboration model
2. PackageCollaboration model
3. Transaction creation
4. Wallet updates

The system is idempotent, atomic (uses Prisma transactions), and follows the escrow pattern described in `razorpay.md`.
