# Auth and Onboarding Documentation

This document explains the authentication and onboarding flows for the Collabrio application. It covers the credential authentication flow, signup flow, and the separate brand and creator onboarding endpoints.

## Overview

Collabrio supports three related but distinct user flows:

1. Core authentication with `next-auth` credentials provider.
2. A generic user signup endpoint at `/api/auth/signup`.
3. Separate onboarding flows for brand and creator accounts at `/api/onboarding/brand` and `/api/onboarding/creator`.

The application stores users in PostgreSQL through Prisma, handles password hashing with `bcryptjs`, and uploads profile media to AWS S3 using the shared upload utility.

---

## 1. Authentication: `/api/auth/[...nextauth]`

### Files involved
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/auth/authOptions.ts`
- `clients/prisma.ts`

### Route behavior

The route exports the NextAuth handler for both `GET` and `POST` requests:

- `GET` is used by NextAuth for session checks and callbacks.
- `POST` is used for sign-in requests.

The route delegates actual auth logic to `authOptions`.

### Auth options

`authOptions` configures a credentials provider.

Key behavior:

- Accepts `email` and `password`.
- Looks up the user by email in the `user` table.
- Verifies the password using `bcrypt.compare` against `user.passwordHash`.
- Returns a user object containing:
  - `id`
  - `email`
  - `username`
  - `role` (mapped from `user.userType`)
  - `onboarding` status

### JWT/session callbacks

- `jwt` callback copies authenticated user fields into the JWT token.
- `session` callback copies values from the JWT token into the session object.

The client receives a session object with:

- `session.user.id`
- `session.user.email`
- `session.user.username`
- `session.user.role` → either `CREATOR` or `BRAND`
- `session.user.onboarding` → either `PENDING` or `COMPLETE`

### Session strategy

- Uses `strategy: "jwt"`.
- Session data is stored in a signed JWT.
- The application requires `NEXTAUTH_SECRET` in environment variables.

### Notes

- `pages.signIn` is set to `/`, so unauthenticated sign-in flows redirect to the home page.
- The route does not currently include additional multi-factor or email verification logic.

---

## 2. Signup: `/api/auth/signup`

### File involved
- `app/api/auth/signup/route.ts`

### Purpose

This endpoint creates a new `BRAND` or `CREATOR` user and associated profile data.

### Request format

Supports both:

- `multipart/form-data` with an optional `profilePic`
- JSON body without image upload

Required fields:

- `email`
- `username`
- `password`
- `type` (`BRAND` or `CREATOR`)

Optional fields:

- `bio`
- `location`
- `niche`
- `instagram`
- `profilePic` (File)

### Validation

The endpoint validates input with `zod`:

- `email` must be a valid email.
- `username` must be 3–30 characters and contain only letters, numbers, or underscores.
- `password` must be at least 8 characters.
- `type` must be either `BRAND` or `CREATOR`.
- `profilePic` is optionally validated as a `File` instance.

If validation fails, the endpoint returns status `400` with an error message.

### Database operations

The endpoint uses a Prisma transaction to guarantee data consistency.

In the transaction:

1. Create a `user` record with:
   - `email`
   - `username`
   - `passwordHash`
   - `userType`
   - `onboarding: "PENDING"`
2. Create a `wallet` record for the user.
3. If `BRAND`:
   - Create a `brandProfile` record with `bio`, `industryTags`, `socialLinks`, and `logoUrl`.
4. If `CREATOR`:
   - Create a `creatorProfile` record with `bio`, `location`, `niche`, `profilePicUrl`, and `platformLinks`.

### Profile picture upload

If `profilePic` is present and an instance of `File`:

- The endpoint converts the file to a `Buffer`.
- Generates an S3 key based on user type and ID.
- Calls `uploadToS3(buffer, key, file.type || 'image/jpeg', true)`.
- Updates the profile record with the uploaded media URL.

Failure during upload is logged but does not fail the signup request.

### Response

- Success: status `201` with `{ message: "Signup successful", userId }`
- Duplicate email or username: status `409`
- Validation error: status `400`
- Internal error: status `500`

---

## 3. Brand onboarding: `/api/onboarding/brand`

### File involved
- `app/api/onboarding/brand/route.ts`

### Purpose

This endpoint is a dedicated onboarding route for brand accounts. It creates a fully completed brand user profile in one request.

### Request format

Expects `multipart/form-data` with fields:

- `email`
- `username`
- `password`
- `bio` (optional)
- `industryTags` (comma-separated string)
- `website` (optional)
- `instagram` (optional)
- `twitter` (optional)
- `logo` (optional File)

### Validation

- `email` must be valid.
- `username` must be 3–30 characters and contain only letters, numbers, or underscores.
- `password` must be at least 8 characters.

### File handling

If `logo` is uploaded:

- Validates allowed image types: JPEG, PNG, WebP.
- Restricts file size to 10MB.
- Uploads the logo to S3 under `onboarding/brands/${username}/logo-${Date.now()}`.

### Database operations

Within a Prisma transaction:

1. Create the `user` record with `userType: "BRAND"` and `onboarding: "COMPLETE"`.
2. Create a `wallet` record for the brand.
3. Create a `brandProfile` record with:
   - `bio`
   - `industryTags`
   - `logoUrl`
   - `socialLinks`

### Response

- Success: status `201` with `{ success: true }`
- Duplicate email or username: status `409`
- Validation or file error: status `400`
- Internal error: status `500`

### Notes

- The onboarding flow is designed to create a fully ready brand account in one step.
- `industryTags` are parsed from a comma-separated string into an array.
- `socialLinks` may include website, Instagram, and Twitter.

---

## 4. Creator onboarding: `/api/onboarding/creator`

### File involved
- `app/api/onboarding/creator/route.ts`

### Purpose

This endpoint creates a fully completed creator account and profile in one request.

### Request format

Expects `multipart/form-data` with fields:

- `email`
- `username`
- `password`
- `bio` (optional)
- `location` (optional)
- `niche` (optional)
- `category` (optional, defaults to `NANO`)
- `followerCount` (optional)
- `nicheTags` (comma-separated string)
- `profilePic` (optional File)

### Validation

- `email` must be valid.
- `username` must be 3–30 characters and contain only letters, numbers, or underscores.
- `password` must be at least 8 characters.

### File handling

If `profilePic` is uploaded:

- Validates allowed image types: JPEG, PNG, WebP.
- Restricts file size to 10MB.
- Uploads the profile picture to S3 under `onboarding/creators/${username}/profile-${Date.now()}`.

### Database operations

Within a Prisma transaction:

1. Create the `user` record with `userType: "CREATOR"` and `onboarding: "COMPLETE"`.
2. Create a `wallet` record for the creator.
3. Create a `creatorProfile` record with:
   - `bio`
   - `location`
   - `niche`
   - `category`
   - `nicheTags`
   - `followerCount`
   - `profilePicUrl`
   - `mlScore` (randomly generated)

### Response

- Success: status `201` with `{ success: true }`
- Duplicate email or username: status `409`
- Validation or file error: status `400`
- Internal error: status `500`

### Notes

- If `followerCount` is not a valid number, the endpoint stores `0`.
- `mlScore` is generated randomly, indicating a simulated creator discovery score for demonstration.

---

## 5. Flow summary

### New user workflow

1. A user signs up using `/api/auth/signup` or one of the onboarding endpoints.
2. The application creates a `user` record and a `wallet`.
3. It creates either a `brandProfile` or a `creatorProfile`.
4. If media is uploaded, it is stored on S3 and the profile is updated with the uploaded URL.

### Login workflow

1. The user submits credentials to NextAuth via `/api/auth/[...nextauth]`.
2. The credentials provider checks the `user` table.
3. If authentication succeeds, session and JWT callbacks populate session data.
4. The client can use the session to authorize access to brand or creator pages.

### Onboarding versus generic signup

- `/api/auth/signup` is a generic sign-up endpoint used for standard registration and can create either user type.
- `/api/onboarding/brand` and `/api/onboarding/creator` are specialized flows designed to create complete, fully onboarded profiles with additional metadata and profile media.

---

## 6. Important implementation notes

- All endpoints use Prisma for DB access and transactions to keep user, wallet, and profile creation atomic.
- Passwords are hashed with `bcryptjs` before storage.
- Profile images are uploaded to S3 using a shared helper, with path structure based on account type and username/user ID.
- The auth flow relies on JWT strategy for `next-auth`, so the application must supply a valid `NEXTAUTH_SECRET`.
- Duplicate username or email checks are enforced before account creation.

