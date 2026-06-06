# Collabrio Payment & Escrow Flow

## Core Principle

Collabrio is not a bank.

Razorpay handles the real money.

Our database only tracks ownership of money and collaboration state.

The platform acts as an escrow layer:

```text
Brand
  ↓
Platform Escrow
  ↓
Creator
```

---

# Enums Used

## Collaboration Status

Tracks collaboration lifecycle.

```prisma
enum CollabStatus {
  PENDING
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

## Content Status

Tracks content lifecycle.

```prisma
enum ContentStatus {
  NOT_SUBMITTED
  SUBMITTED
  IMPROVEMENT_REQUESTED
  APPROVED
  REJECTED
}
```

---

## Payment Status

Tracks where money currently resides.

```prisma
enum PaymentStatus {
  UNPAID
  BRAND_PAID
  PLATFORM_HOLD
  CREATOR_PAID
  REFUNDED
}
```

---

## Transaction Status

Tracks external payment execution.

```prisma
enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  INWALLET
}
```

---

# Complete Happy Path

Assume:

```text
Package Price = ₹5,000

Platform Fee = 10%
Creator Share = 90%
```

---

# Step 1 — Brand Sends Invitation

Brand selects package and sends collaboration request.

## Collaboration

```text
CollabStatus = PENDING
```

## Payment

```text
PaymentStatus = UNPAID
```

## Content

```text
No PackageCollaboration yet
```

## Money

```text
Brand      ₹5000
Platform   ₹0
Creator    ₹0
```

---

# Step 2 — Creator Accepts

Creator accepts invitation.

## Collaboration

```text
CollabStatus = ACTIVE
```

## Content

```text
ContentStatus = NOT_SUBMITTED
```

## Payment

```text
PaymentStatus = UNPAID
```

## Money

No movement.

---

# Step 3 — Brand Pays

Brand completes Razorpay Checkout.

Payment successfully captured.

Create:

```text
TransactionType   = BRAND_PAYMENT
TransactionStatus = COMPLETED
```

## Collaboration

```text
CollabStatus = ACTIVE
```

## Payment

```text
PaymentStatus = BRAND_PAID
```

## Money

Money has left the brand.

```text
Brand      -5000
Platform   0
Creator    0
```

---

# Step 4 — Escrow Lock

Immediately after payment verification.

Platform becomes escrow holder.

Update platform wallet:

```text
platform.pendingBalance += 5000
```

## Payment

```text
PaymentStatus = PLATFORM_HOLD
```

Meaning:

```text
Brand has paid.
Creator has not earned yet.
Platform is holding funds.
```

## Money

```text
Brand      -5000
Platform   Pending: 5000
Creator    0
```

---

# Step 5 — Creator Uploads Draft

Creator submits work.

## Content

```text
ContentStatus = SUBMITTED
```

## Payment

```text
PaymentStatus = PLATFORM_HOLD
```

## Money

Still locked in escrow.

```text
Platform Pending = 5000
```

---

# Step 6 — Brand Requests Changes

Brand is not satisfied.

## Content

```text
ContentStatus = IMPROVEMENT_REQUESTED
```

## Payment

```text
PaymentStatus = PLATFORM_HOLD
```

## Money

Still locked.

No wallet changes.

---

# Step 7 — Creator Resubmits

Creator uploads revised content.

## Content

```text
ContentStatus = SUBMITTED
```

## Payment

```text
PaymentStatus = PLATFORM_HOLD
```

## Money

Still locked.

---

# Step 8 — Brand Approves

This is the escrow release event.

Assume:

```text
Package Price = ₹5000

Creator Share = ₹4500
Platform Fee = ₹500
```

---

## Content

```text
ContentStatus = APPROVED
```

---

## Collaboration

```text
CollabStatus = COMPLETED
```

---

## Payment

```text
PaymentStatus = CREATOR_PAID
```

---

## Wallet Updates

Release escrow:

```text
platform.pendingBalance -= 5000
```

Platform earns fee:

```text
platform.currentBalance += 500
platform.totalEarned += 500
```

Creator receives earnings:

```text
creator.currentBalance += 4500
creator.totalEarned += 4500
```

---

## Transactions Created

Creator earning:

```text
TransactionType   = CREATOR_EARNING
TransactionStatus = INWALLET
```

Platform fee:

```text
TransactionType   = PLATFORM_FEE
TransactionStatus = COMPLETED
```

---

## Money

```text
Brand      spent ₹5000

Platform   earned ₹500

Creator    earned ₹4500
```

---

# Creator Withdrawal

Creator decides to withdraw earnings.

This is a completely separate flow.

Payment status DOES NOT change.

It remains:

```text
PaymentStatus = CREATOR_PAID
```

because the creator already owns the money.

---

## Withdrawal Request

Create:

```text
TransactionType   = PAYOUT
TransactionStatus = PENDING
```

Call Razorpay Payout API.

---

## Razorpay Success Webhook

Update:

```text
TransactionStatus = COMPLETED
```

Wallet:

```text
creator.currentBalance -= withdrawAmount
```

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

Tracks:

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

---

# Important Rule

Never release creator earnings before:

```text
ContentStatus = APPROVED
```

Never release escrow before:

```text
CollabStatus = COMPLETED
```

The platform wallet is the single source of truth for escrowed funds.
