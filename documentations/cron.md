# Cron jobs and analytics flow

This document explains how scheduled jobs work in Collabrio, how the snapshot and populate cron flows interact, and how raw Meta/Instagram data is preserved and transformed.

## Cron schedule

The app uses Vercel cron configuration in `vercel.json`:

- `/api/cron/snapshot` runs daily at `0 1 * * *` (1:00 AM)
- `/api/cron/populate` runs daily at `25 1 * * *` (1:25 AM)

These two jobs are intentionally separated so the system first collects raw data and then processes it into analytics.
vercel only accepts GET req so although we are POSTing into database but we still use a GET request.

## Authorization

Both routes require a bearer token header:

- `Authorization: Bearer ${process.env.CRON_SECRET}`

If the header is missing or incorrect, the route returns `401 Unauthorized`.

## Tables involved

### `CreatorSocialAccount`

Used by the snapshot job as the source of connected Instagram accounts. It contains:

- `accessToken` — the token used to call Meta Graph API
- `tokenExpiresAt` — when the token is expected to expire
- `igAccountId` — Instagram business account id
- `pageId` — Facebook page id
- `connected` — whether the creator connection is active

### `CreatorSocialRawSnapshot`

This is the raw-data archive table. It stores the full response from Meta API calls without transforming it.

Fields:

- `creatorId`
- `platform` (`INSTAGRAM`)
- `rawData` — the full JSON response
- `fetchedAt`

This raw table preserves original Meta responses for future replay, debugging, and auditing.

### `CreatorDailyAnalytics`

This table stores one derived row per creator per day.

Fields:

- `followers`
- `reach`
- `impressions`
- `engagements`
- `likes`
- `comments`
- `shares`
- `saves`
- `replies`
- `profileViews`

It is computed from the latest raw snapshot and is meant for daily reporting and trend display.

### `creatorFullAnalytics`

This table stores aggregated analytics for each creator over time.

It keeps totals and a computed `engagementRate`, and is updated by the populate job rather than replaced.

## Snapshot flow: `app/api/cron/snapshot/route.ts`

This job collects Instagram data from Meta and stores it raw.

Steps:

1. The cron job calls `/api/cron/snapshot` with the correct bearer token.
2. The route loads all `CreatorSocialAccount` records where `platform = "INSTAGRAM"` and `connected = true`.
3. For each connected account:
   - It calls the Meta Graph API for the Instagram account profile:
     - `https://graph.facebook.com/v19.0/{igAccountId}`
     - fields: `username,followers_count,media_count`
   - It calls the Meta Graph API for daily insights:
     - `https://graph.facebook.com/v19.0/{igAccountId}/insights`
     - metrics: `reach,follower_count`
     - period: `day`
   - It calls the Meta Graph API for total insights:
     - `https://graph.facebook.com/v19.0/{igAccountId}/insights`
     - metrics: `accounts_engaged,profile_views,total_interactions,likes,comments,shares,saves,replies`
     - metric_type: `total_value`
     - period: `day`
4. It creates a `CreatorSocialRawSnapshot` row with the combined raw data.

### Why raw snapshots matter

- They preserve the original Meta API response.
- They let the populate job retry or reprocess data without re-calling Meta.
- They provide an audit trail and a place to inspect API differences.
- They make it safer to extend analytics later without losing source data.

## Populate flow: `app/api/cron/populate/route.ts`

This job transforms the latest raw snapshot into usable analytics.

Steps:

1. The cron job calls `/api/cron/populate` with the correct bearer token.
2. The route loads all creators from `CreatorProfile`.
3. For each creator:
   - It loads the latest `CreatorSocialRawSnapshot` for that creator and platform.
   - It extracts values from nested raw JSON using a helper function.
   - It computes:
     - `followers`
     - `reach`
     - `engagements = likes + comments + shares + saves + replies`
     - `impressions` (uses `total_interactions` when available or `reach * 1.35` fallback)
     - `engagementRate = (engagements / reach) * 100`
4. It upserts a `CreatorDailyAnalytics` row for today.
5. It also updates the `creatorFullAnalytics` row for the creator:
   - creates it if missing
   - increments cumulative totals by the new daily/metric deltas
   - updates the stored `followers`, `reach`, and `engagementRate`

### Why the two-step design is intelligent

- `snapshot` preserves raw Meta data and decouples data collection from analytics processing.
- `populate` can run later and use the snapshot as its source of truth.
- This separation improves reliability when Meta responses are delayed or one account fails.
- It also avoids repeated Graph API calls when the same raw data can be reused.

## Architecture summary

- `CreatorSocialAccount` is the active connection table.
- `CreatorSocialRawSnapshot` is the immutable source-of-truth archive.
- `CreatorDailyAnalytics` is the daily derived dataset.
- `creatorFullAnalytics` is the aggregated summary dataset.

This design preserves raw info and stores derived analytics separately, which is a best practice for analytics pipelines.

## Failure notes

- If a Meta token is expired or invalid, the snapshot job will fail for that creator.
- The app does not currently refresh the Meta token automatically.
- Reconnecting Instagram through the Meta connect flow is required to restore cron snapshot access.
