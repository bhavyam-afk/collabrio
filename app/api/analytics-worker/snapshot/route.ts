import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"

/**
 * Analytics worker endpoint — processes a single snapshot job.
 *
 * This route is invoked per-job by the BullMQ worker (see clients/analyticsQueue.ts).
 * It performs the exact same three Meta Graph API calls that the old serial cron route
 * used to do, but scoped to one creator per job, so:
 * - A failed/expired token for one creator can't block anyone else's snapshot
 * - Each job gets its own retry with exponential backoff
 * - Jobs are tracked in the AnalyticsJob table for observability
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const job = await prisma.analyticsJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Mark as processing
    await prisma.analyticsJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    })

    // Fetch the creator's social account
    const account = await prisma.creatorSocialAccount.findFirst({
      where: {
        creatorId: job.creatorId,
        platform: "INSTAGRAM",
        connected: true,
        igAccountId: job.igAccountId,
      },
    })

    if (!account || !account.accessToken) {
      await prisma.analyticsJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: `No connected Instagram account found for creator ${job.creatorId}`,
        },
      })
      return NextResponse.json({ ok: true, status: "no_account" })
    }

    try {
      // 1. Profile data
      const profileRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}` +
          `?fields=username,followers_count,media_count` +
          `&access_token=${account.accessToken}`
      )
      const profile = await profileRes.json()

      console.log("[ANALYTICS_WORKER] Profile fetched for", account.creatorId)

      // 2. Daily insights
      const dailyRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}/insights` +
          `?metric=reach,follower_count` +
          `&period=day` +
          `&access_token=${account.accessToken}`
      )
      const dailyInsights = await dailyRes.json()

      console.log("[ANALYTICS_WORKER] Daily insights fetched for", account.creatorId)

      // 3. Total insights
      const totalRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}/insights` +
          `?metric=accounts_engaged,profile_views,total_interactions,likes,comments,shares,saves,replies` +
          `&metric_type=total_value` +
          `&period=day` +
          `&access_token=${account.accessToken}`
      )
      const totalInsights = await totalRes.json()

      console.log("[ANALYTICS_WORKER] Total insights fetched for", account.creatorId)

      // 4. Save raw snapshot
      await prisma.creatorSocialRawSnapshot.create({
        data: {
          creatorId: account.creatorId,
          platform: "INSTAGRAM",
          rawData: {
            profile,
            insights: {
              daily: dailyInsights,
              total: totalInsights,
            },
          },
        },
      })

      // 5. Mark job succeeded
      await prisma.analyticsJob.update({
        where: { id: jobId },
        data: { status: "SUCCEEDED" },
      })

      console.log("[ANALYTICS_WORKER] Snapshot saved for", account.creatorId)

      return NextResponse.json({ ok: true, status: "succeeded" })
    } catch (err) {
      const attempts = job.attempts + 1
      const maxAttempts = 3

      await prisma.analyticsJob.update({
        where: { id: jobId },
        data: {
          status: attempts >= maxAttempts ? "FAILED" : "QUEUED",
          attempts,
          error: err instanceof Error ? err.message : String(err),
        },
      })

      console.error("[ANALYTICS_WORKER] Job failed for", job.creatorId, err)

      return NextResponse.json({
        ok: true,
        status: attempts >= maxAttempts ? "failed" : "retrying",
        error: err instanceof Error ? err.message : String(err),
      })
    }
  } catch (err) {
    console.error("[ANALYTICS_WORKER] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
