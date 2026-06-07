# Collaboration Flow Documentation

## Overview

This document describes the end-to-end collaboration flow in Collabrio, from a brand discovering creator packages to a collaboration completing. It maps the key API routes, the state changes for `Collaboration`, `PackageCollaboration`, and `PaymentStatus`, and the responsibilities of brands and creators.

## Core Models and Enums

### Collaboration

`Collaboration` is the central workflow object linking:
- `brandId`
- `creatorId`
- `packageId`
- `collabStatus`
- `PaymentStatus`

Enum values:
- `PENDING` — brand has requested a package, creator has not yet accepted
- `ACTIVE` — creator accepted the request and collaboration is in progress
- `COMPLETED` — brand approved the submitted content and payment was released
- `CANCELLED` — collaboration was withdrawn or cancelled before completion

### PackageCollaboration

`PackageCollaboration` tracks content delivery and payment status for a collaboration:
- `contentStatus`
- `contentDraft`
- `PaymentStatus`
- `revisionCount`
- `brandFeedback`

Enum values for `contentStatus`:
- `NOT_SUBMITTED` — no draft has been uploaded yet
- `SUBMITTED` — creator uploaded draft content for brand review
- `IMPROVEMENT_REQUESTED` — brand asked for revisions, content remains under escrow
- `APPROVED` — brand approved final content
- `REJECTED` — available in schema but not actively used in current routes

Enum values for `PaymentStatus`:
- `UNPAID` — no payment has been initiated
- `BRAND_PAID` — brand has paid, funds are tracked in the package collaboration
- `PLATFORM_HOLD` — funds are held in escrow by the platform
- `CREATOR_PAID` — creator has been paid and earnings are settled
- `REFUNDED` — funds were returned to the brand after cancellation

## Actors and Main Steps

### Brand

1. Browse creator package catalog.
2. Send a collaboration request for a specific package.
3. Track collaboration requests and active work on the brand dashboard.
4. Initiate payment once the creator has accepted and work is active.
5. Review submitted drafts and either approve or request improvements.
6. Cancel active collaborations if necessary.

### Creator

1. View incoming collaboration requests.
2. Accept a pending request to begin work.
3. Upload draft content once payment is made.
4. View status and brand feedback.
5. Resubmit after improvements if requested.

## Route Map

### 1. Discover creator packages

`GET /api/brand/discover`
- Authenticated brand only.
- Returns all active creator packages with status `packageStatus: ACTIVE`.
- Excludes packages for which the same brand already has `Collaboration` in `PENDING` or `ACTIVE` state.

`POST /api/brand/discover`
- Authenticated brand only.
- Body: `{ packageId }`
- Creates a new `Collaboration` with:
  - `collabStatus: PENDING`
  - `PaymentStatus: UNPAID`
- Prevents sending a request for the brand's own package.
- Prevents duplicate requests when a pending or active collaboration already exists.

### 2. Creator dashboard and request acceptance

`GET /api/creator/dashboard`
- Authenticated creator only.
- Returns the creator's collaborations grouped by status:
  - `pendingRequests` (`PENDING`)
  - `acceptedCollaborations` (`ACTIVE`)
  - `cancelledCollaborations` (`CANCELLED`)
  - `completedCollaborations` (`COMPLETED`)
- Also returns creator wallet earnings.

`PATCH /api/creator/dashboard`
- Authenticated creator only.
- Body: `{ collabId }`
- Accepts a pending collaboration by:
  - validating `collabStatus === PENDING`
  - creating `PackageCollaboration` if needed with `contentStatus: NOT_SUBMITTED`
  - updating `collabStatus` to `ACTIVE`

### 3. Brand dashboard and cancellation flow

`GET /api/brand/dashboard`
- Authenticated brand only.
- Returns brand collaborations grouped by status:
  - `pendingRequests` (`PENDING`)
  - `activeCollaborations` (`ACTIVE`)
  - `cancelledCollaborations` (`CANCELLED`)
  - `completedCollaborations` (`COMPLETED`)

`PATCH /api/brand/dashboard`
- Authenticated brand only.
- Body: `{ collabId, action }`
- Supported actions:
  - `withdraw` — cancels pending requests only
  - `cancel` — cancels active collaborations

Cancellation rules:
- `withdraw` is allowed only when `collabStatus === PENDING`.
- `cancel` is allowed only when `collabStatus === ACTIVE`.
- If an active collaboration has escrow in `PLATFORM_HOLD`, the route:
  - sets `collabStatus` to `CANCELLED`
  - sets `PaymentStatus` to `REFUNDED`
  - decrements platform pending balance
  - credits the brand wallet with the refund amount
  - optionally compensates the creator if content was submitted or under revision
- If active collaboration has no escrow or payment yet, it can be cancelled directly.

### 4. Payment and escrow

`POST /api/razorpay/payment/create`
- Authenticated brand only.
- Body: `{ collabId }`
- Validates that collaboration exists and is `ACTIVE`.
- Creates or reuses a Razorpay order.
- Records a `Transaction` with:
  - `type: BRAND_PAYMENT`
  - `status: PENDING`
  - `amount` equal to package price
- This is the first step in moving funds from the brand into the platform.

`POST /api/razorpay/payment/verify`
- Public route called by the frontend after Razorpay checkout.
- Body: `{ razorpay_payment_id, razorpay_order_id, razorpay_signature, collabId }`
- Validates the Razorpay signature.
- Marks the brand payment transaction `COMPLETED`.
- Moves funds into platform escrow:
  - increments platform wallet `pendingBalance`
  - increases brand wallet `totalSpent`
- Updates collaboration and package collaboration statuses:
  - `Collaboration.PaymentStatus` → `PLATFORM_HOLD`
  - `PackageCollaboration.PaymentStatus` → `BRAND_PAID`
  - `PackageCollaboration.contentStatus` → `NOT_SUBMITTED`
- At this stage, the brand has paid and the creator is cleared to deliver content.

### 5. Creator uploads content

`POST /api/uploads/creatordraft`
- Authenticated creator only.
- Accepts multipart form data with:
  - `collabId`
  - `file`
- Validates:
  - collaboration belongs to the creator
  - `collabStatus === ACTIVE`
  - package collaboration payment status is `BRAND_PAID` or `PLATFORM_HOLD`
- Uploads the file to S3 under `drafts/creators/{creatorId}/collabs/{collabId}/...`.
- Creates or updates `PackageCollaboration`:
  - sets `contentStatus: SUBMITTED`
  - appends the uploaded file metadata to `contentDraft`
  - stores `draftSubmittedAt`
- Returns preview URLs and updated content status.

`DELETE /api/uploads/creatordraft`
- Authenticated creator only.
- Body: `{ collabId, fileIndex }`
- Validates:
  - collaboration belongs to the creator
  - content exists
  - content is not `APPROVED`
- Removes the specified file from `contentDraft`.
- If no files remain, resets `contentStatus` to `NOT_SUBMITTED`.
- Otherwise keeps `contentStatus` as `SUBMITTED`.

### 6. Brand content review

`GET /api/brand/content/[collabId]`
- Authenticated brand only.
- Returns detailed content state for a specific collaboration.
- Computes `contentStatus` as:
  - `NOT_SUBMITTED` if there are no valid uploaded files
  - otherwise the stored `contentStatus`
- Returns `paymentStatus`, uploaded files with presigned preview URLs, brand feedback, and revision count.

`PATCH /api/brand/content/[collabId]`
- Authenticated brand only.
- Body: `{ action, feedback? }`
- Supported actions:
  - `approve`
  - `request_improvement`

Approve path:
- Requires submitted content
- Updates `PackageCollaboration`:
  - `contentStatus: APPROVED`
  - `draftApprovedAt`
  - `PaymentStatus: CREATOR_PAID`
- Updates `Collaboration`:
  - `collabStatus: COMPLETED`
  - `PaymentStatus: CREATOR_PAID`
- Releases escrow:
  - decrements platform wallet `pendingBalance`
  - increments creator wallet `currentBalance` and `totalEarned`
  - credits platform fee to platform wallet
- Creates transactions for creator earnings and platform fee.

Request improvement path:
- Updates `PackageCollaboration`:
  - `contentStatus: IMPROVEMENT_REQUESTED`
  - `brandFeedback`
  - `revisionCount`++
  - `PaymentStatus: PLATFORM_HOLD`
- Keeps funds locked in escrow until final approval or cancellation.

### 7. Creator content status fetch

`GET /api/creator/content/[collabId]`
- Authenticated creator only.
- Returns status details for the creator's side of a collaboration:
  - `collabStatus`
  - `contentStatus`
  - `paymentStatus`
  - `uploadedFiles`
  - `revisionCount`
  - `feedback`
  - `isPaid` (true when brand payment transaction completed)

## Full collaboration sequence

1. Brand discovers a creator package on the marketplace.
2. Brand sends a request using `POST /api/brand/discover`.
3. System creates `Collaboration(collabStatus: PENDING, PaymentStatus: UNPAID)`.
4. Creator sees the incoming request via `GET /api/creator/dashboard`.
5. Creator accepts the request using `PATCH /api/creator/dashboard`.
6. System updates collaboration to `ACTIVE` and creates a `PackageCollaboration` with `contentStatus: NOT_SUBMITTED`.
7. Brand starts payment via Razorpay:
   - `POST /api/razorpay/payment/create` creates a Razorpay order and pending transaction.
   - frontend completes checkout.
   - `POST /api/razorpay/payment/verify` verifies payment, sets escrow, and updates payment statuses.
8. Creator uploads draft files via `POST /api/uploads/creatordraft`.
9. Collaboration content enters `SUBMITTED`.
10. Brand reviews the submission via `PATCH /api/brand/content/[collabId]`.
    - If approved: `contentStatus` → `APPROVED`, `collabStatus` → `COMPLETED`, creator is paid.
    - If improvement requested: `contentStatus` → `IMPROVEMENT_REQUESTED`, funds stay on `PLATFORM_HOLD`, creator revises.
11. If the brand cancels an active collaboration before approval, the platform may refund the brand and optionally compensate the creator depending on content progress.

## Important status transitions

### Collaboration lifecycle

- `PENDING` → `ACTIVE`: creator accepts a request
- `ACTIVE` → `COMPLETED`: brand approves content and payment is released
- `ACTIVE` → `CANCELLED`: brand cancels an active collaboration
- `PENDING` → `CANCELLED`: brand withdraws a request

### Content lifecycle

- `NOT_SUBMITTED` → `SUBMITTED`: creator uploads draft content
- `SUBMITTED` → `APPROVED`: brand approves content
- `SUBMITTED` → `IMPROVEMENT_REQUESTED`: brand asks for revisions
- `IMPROVEMENT_REQUESTED` → `SUBMITTED`: creator resubmits revised content
- `SUBMITTED` or `IMPROVEMENT_REQUESTED` → `NOT_SUBMITTED`: creator deletes all draft files

### Payment lifecycle

- `UNPAID` → `BRAND_PAID`: brand payment is tracked on the package collaboration after verification
- `BRAND_PAID` → `PLATFORM_HOLD`: collaboration-level payment status once funds enter platform escrow
- `PLATFORM_HOLD` → `CREATOR_PAID`: creator payout after approval
- `PLATFORM_HOLD` → `REFUNDED`: refund flow when cancellation happens before final approval

## Notes and Observations

- The brand `discover` route prevents requesting packages with an existing active or pending collaboration from the same brand.
- The workflow enforces that content upload only happens after the collaboration is `ACTIVE` and payment is secured.
- Escrow logic is handled in the payment verification and brand approval/cancellation routes.
- `REJECTED` exists in schema but is not used by the current content review routes.

## Route responsibilities summary

- Brand-facing flows:
  - `GET /api/brand/discover`
  - `POST /api/brand/discover`
  - `GET /api/brand/dashboard`
  - `PATCH /api/brand/dashboard`
  - `GET /api/brand/content/[collabId]`
  - `PATCH /api/brand/content/[collabId]`
  - `POST /api/razorpay/payment/create`
  - `POST /api/razorpay/payment/verify`

- Creator-facing flows:
  - `GET /api/creator/dashboard`
  - `PATCH /api/creator/dashboard`
  - `GET /api/creator/content/[collabId]`
  - `POST /api/uploads/creatordraft`
  - `DELETE /api/uploads/creatordraft`

This file is intended to provide a single reference for the collaboration lifecycle and state transitions in Collabrio.
