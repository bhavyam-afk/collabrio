# Meta / Instagram Connect

This document explains how the Meta connect flow works in Collabrio, which routes and UI pieces are involved, what Meta technology is used, and where the data is stored.

## What is connected

The Meta connect feature lets a creator connect their Instagram Professional account through Facebook / Meta OAuth so the app can fetch Instagram profile and insights data later.

It is not a login provider for the app. It is a social account connection used for analytics and creator discovery.

## Components involved

- `components/Meta/MetaConnectButton.tsx`
  - Client-side button shown to authenticated creators.
  - Checks `/api/creator/${id}/creator-social-account` to see whether Instagram is already connected.
  - Redirects to the Meta/Facebook OAuth consent page when the user clicks "Connect Instagram".
- `app/api/auth/meta/callback/route.ts`
  - Server-side callback route for OAuth code exchange.
  - Converts the returned `code` into a long-lived Meta access token.
  - Queries user Facebook pages and linked Instagram account details.
  - Writes or updates `CreatorSocialAccount` in the database.
- `app/api/creator/[id]/creator-social-account/route.ts`
  - Server-side status endpoint used by the button to show connected state.

## Meta technology and OAuth flow

### OAuth authorization URL

The connect button builds an auth URL to:

`https://www.facebook.com/v19.0/dialog/oauth`

It sends:

- `client_id` → `NEXT_PUBLIC_META_APP_ID`
- `redirect_uri` → `NEXT_PUBLIC_META_REDIRECT_URI`
- `scope` → `email,public_profile,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights`
- `response_type=code`
- `state` → encoded JSON containing `{ creatorId, username }`

The `state` payload is important because the callback needs the creator username to look up the creator record.

### Callback exchange steps

`app/api/auth/meta/callback/route.ts` performs these steps:

1. Validate `code` and `state`.
2. Decode `state` to get the creator `username`.
3. Exchange the short-lived OAuth code for a short-lived access token:
   - `https://graph.facebook.com/v19.0/oauth/access_token`
   - parameters: `client_id`, `client_secret`, `redirect_uri`, `code`
4. Exchange the short-lived token for a long-lived token:
   - `https://graph.facebook.com/v19.0/oauth/access_token`
   - parameters: `grant_type=fb_exchange_token`, `client_id`, `client_secret`, `fb_exchange_token`
5. Fetch Facebook Pages for the user:
   - `https://graph.facebook.com/v19.0/me/accounts`
   - fields: `id,name,access_token,instagram_business_account`
6. Pick the first page that has a linked Instagram business account and a page access token.
7. Lookup Instagram account metadata:
   - `https://graph.facebook.com/v19.0/{igAccountId}`
   - fields: `id,username,followers_count,media_count`
8. Lookup the local creator by `username`.
9. Upsert `CreatorSocialAccount` with the Instagram connection data.

### Token lifetime

The callback stores token expiration using `expires_in` from Meta's long-lived token response.

- `tokenExpiresAt` is calculated as `Date.now() + expires_in * 1000`.
- The code does not refresh tokens automatically; it relies on the long-lived token stored in the DB.

The actual lifetime is governed by Meta. A long-lived token from Meta is typically valid for about 60 days, but the app should be considered responsible for refreshing it before expiration if this feature is extended.

## Tables and fields used

### `CreatorSocialAccount`

This is the primary table for the Meta/Instagram connection.

Fields:

- `creatorId` — foreign key to `CreatorProfile`
- `platform` — currently stores `INSTAGRAM`
- `accessToken` — the page-level access token used for Graph API calls
- `tokenExpiresAt` — when the token should expire
- `igAccountId` — Instagram Business account id
- `pageId` — Facebook Page id
- `connected` — boolean status flag
- `createdAt`, `updatedAt`

This table is updated via `auth/meta/callback` and read via `/api/creator/[id]/creator-social-account`.

### `CreatorProfile`

Used to map the currently authenticated NextAuth user to the creator record.

The callback route looks up the `User` by `username`, then loads the related `CreatorProfile` to determine the correct `creatorId`.

## Data flow summary

- Creator clicks `Connect Instagram`.
- App redirects to Meta/Facebook OAuth.
- Meta redirects back to `/api/auth/meta/callback`.
- Server exchanges tokens, fetches page and IG info, and stores the result in `CreatorSocialAccount`.
- After connection, the UI will detect the connected state and stop showing the connect button.

## Why this matters

This connection is the source of truth for later analytics and cron jobs. It stores the account and token required to pull Instagram data from Meta.

If the token expires or the page connection is removed, the cron snapshot job will fail for that account until the creator reconnects.
