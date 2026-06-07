# Collabrio Documentation

## What is Collabrio?

Collabrio is a marketplace platform for brands and creators to discover each other, collaborate on content packages, and manage payment, draft delivery, and approval workflows.

The app solves the common problem of informal brand/creator collaborations by adding:

- a brand onboarding flow
- a creator onboarding flow
- package discovery and collaboration requests
- in-app content upload and review
- Razorpay payment capture with escrow-style hold until approval
- wallet tracking for creators and brands

Collabrio is designed as a college/demo project, so the core features focus on collaboration flow and safe payment handling rather than full production payout automation.

## How to use this project

1. Run the app locally with the required environment variables for Next.js, Prisma, AWS S3, and Razorpay.
2. Create two user accounts:
   - one or more brands
   - one or more creators
3. A brand discovers creators and sends a collaboration request on a package.
4. The creator accepts the request and uploads draft content once the brand has paid.
5. The brand reviews the draft, either requesting improvements or approving it.
6. When the brand approves, the app releases the locked payment into the creator's wallet balance.

### Who should read this documentation

- Students and reviewers who want a quick overview of what Collabrio does
- Developers who want to understand the app flow without reading all the code first
- Testers who need sample accounts for manual testing

## Test accounts

Use these sample credentials to log in and exercise the brand and creator flows.

### Brand accounts

- Email: brand1@example.com
  Password: BrandPass123!
- Email: brand2@example.com
  Password: BrandPass123!

### Creator accounts
 
- Email: creator1@example.com
  Password: CreatorPass123!
- Email: creator2@example.com
  Password: CreatorPass123!

> Note: These are example test credentials. If you want, I can also add a small `documentations/credentials.md` file with more detail for each role and expected test scenarios.
