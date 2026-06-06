# Razorpay Payment Setup Guide

## Overview
This guide explains how to set up Razorpay for payment processing in Collabrio.

---

## Step 1: Get Razorpay Credentials

### From Razorpay Dashboard

1. Go to [https://razorpay.com/docs/](https://razorpay.com/docs/)
2. Sign in to your Razorpay dashboard
3. Navigate to **Settings** → **API Keys**
4. You'll see:
   - **Key ID** (public key)
   - **Key Secret** (private key, keep this secure)

### For Account Number (Payouts)

1. Go to **Settings** → **Account Settings**
2. Find your **Account Number** (for payout transfers)

---

## Step 2: Configure Environment Variables

### Create `.env.local` file

In the project root, create a `.env.local` file (not tracked by git):

```bash
# Razorpay Keys (REQUIRED for payments)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx        # Your public key
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx   # Your private key (KEEP SECRET)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx  # Same as Key ID, exposed to frontend

# Razorpay Account Details
RAZORPAY_ACCOUNT_NUMBER=1112220050XXXXX  # For creator payouts

# Other Required Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/collabrio
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

### Important Notes

- ⚠️ **NEVER commit `.env.local` to git** — It contains sensitive keys
- The `.env.local` file is in `.gitignore` by default
- `RAZORPAY_KEY_SECRET` should ONLY be used in backend routes (never exposed to frontend)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safely exposed to the frontend client

---

## Step 3: Verify Configuration

### Check if Razorpay is Loaded

Open the browser console (F12) and check the logs:

```
[Razorpay] Loading SDK...
[Razorpay] SDK already loaded
[Razorpay] Creating order for collab: [collab-id]
[Razorpay] Order created: { orderId: 'order_...', amount: ..., currency: 'INR' }
[Razorpay] Opening checkout with key: rzp_...
```

If you see errors like:
```
[Razorpay] Razorpay Key ID not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env.local file.
```

Your environment variables are not set correctly.

---

## Step 4: Test Payment Flow

### Prerequisites

1. Create brand and creator accounts
2. Creator must have an ACTIVE package
3. Brand must send invitation to creator
4. Creator must accept invitation

### Happy Path Test

1. **Brand Dashboard** → Open collaboration → Click "Pay now"
2. Razorpay modal should appear
3. Select payment method:
   - UPI (quick test with Razorpay test UPI)
   - Card (use test card: `4111 1111 1111 1111`)
   - Netbanking
   - Wallet
4. Complete payment
5. Verify success: Payment status should change to "COMPLETED"

### Test Cards

| Card Number | Expiry | CVV | Status |
|---|---|---|---|
| 4111 1111 1111 1111 | Any future date | Any 3 digits | ✅ Success |
| 4000 0000 0000 0002 | Any future date | Any 3 digits | ❌ Declined |

---

## Step 5: Monitor Payment Flow

### Browser Console Logs

All Razorpay operations log to the console with `[Razorpay]` prefix:

```
✅ Order created successfully
[Razorpay] Order created: { orderId: 'order_...', amount: 50000, currency: 'INR' }

✅ Payment successful
[Razorpay] Payment success, verifying: { paymentId: 'pay_...', orderId: 'order_...' }

✅ Payment verified on backend
[Razorpay] Payment verified successfully
```

### Backend Logs

Server logs are printed to the terminal:

```
[CREATE] Order created for collab [id], order_id: order_xxx, amount: 50000
[VERIFY] Payment verified successfully for collab [id], payment_id: pay_xxx
```

---

## Step 6: Debug Checklist

### Problem: "Razorpay Key ID not configured"

**Solution:**
- Check `.env.local` exists in project root
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Restart dev server: `npm run dev`
- Clear browser cache

### Problem: "Failed to load Razorpay SDK"

**Solution:**
- Check internet connection
- Verify Razorpay CDN is accessible (https://checkout.razorpay.com/v1/checkout.js)
- Check browser console for network errors

### Problem: "Order creation failed"

**Solution:**
- Check collaboration is in ACTIVE status
- Verify brand is logged in and owns the collaboration
- Check backend logs for error details
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct (server-side)

### Problem: "Payment verification failed"

**Solution:**
- Check signature validation in `/api/razorpay/payment/verify`
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Verify payment ID is valid

### Problem: Razorpay modal doesn't appear

**Solution:**
- Check browser console for `[Razorpay]` logs
- Verify JavaScript is enabled
- Check for browser pop-up blocker
- Try incognito mode to exclude extensions
- Check network tab in DevTools for failed requests

---

## Step 7: Production Deployment

### Switch to Live Keys

In production, use your **LIVE API keys** instead of test keys:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx      # LIVE key (not test_)
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx        # LIVE secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

### Security Checklist

- [ ] Use environment variables from provider (Vercel, AWS, etc.)
- [ ] Never commit sensitive keys to repository
- [ ] Verify `RAZORPAY_KEY_SECRET` is only used server-side
- [ ] Enable HTTPS for all payment routes
- [ ] Set up webhook signatures verification for increased security
- [ ] Monitor payment logs and errors

---

## Payment Flow After Setup

1. **Brand initiates payment** → `POST /api/razorpay/payment/create`
   - Creates order in Razorpay
   - Returns `orderId` and `amount` to frontend

2. **Brand completes payment** → Razorpay modal handles checkout
   - Brand selects payment method
   - Payment gateway processes

3. **Frontend verifies** → `POST /api/razorpay/payment/verify`
   - Validates Razorpay signature
   - Updates `PaymentStatus = PLATFORM_HOLD`
   - Locks funds in escrow

4. **Creator uploads content** → `POST /api/uploads/creatordraft`
   - Checks `PaymentStatus = PLATFORM_HOLD`
   - Only allows if brand has paid

5. **Brand approves** → `PATCH /api/brand/content/[collabId]`
   - Releases escrow
   - Pays creator: 90%
   - Platform fee: 10%
   - Sets `PaymentStatus = CREATOR_PAID`

---

## Common Questions

### Q: Can I test with live keys?
**A:** Yes, but test cards won't work. Use Razorpay test keys during development.

### Q: How do I handle failed payments?
**A:** Currently, failed payments don't create refund transactions. The `PaymentStatus` stays `UNPAID`, and the brand can retry.

### Q: How do creators withdraw their earnings?
**A:** Use `POST /api/razorpay/payout` (separate flow). Creator's earnings are in `wallet.currentBalance`.

### Q: What if payment verification fails?
**A:** The transaction stays in PENDING state. Brand can retry payment.

### Q: Is the payment secure?
**A:** Yes, Razorpay handles PCI compliance. Our backend verifies signatures to prevent tampering.

---

## Support

For Razorpay-specific issues:
- [Razorpay Docs](https://razorpay.com/docs/)
- [Razorpay Support](https://razorpay.com/support/)

For Collabrio payment flow issues:
- Check browser console logs (`[Razorpay]` prefix)
- Check backend logs (terminal where you ran `npm run dev`)
- Review `PAYMENT_FLOW_UPDATED.md` for state machine details
