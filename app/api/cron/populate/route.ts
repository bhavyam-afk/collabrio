import { NextResponse } from "next/server";
import prisma from "@/clients/prisma";

function getMetric(metrics: any[], name: string): number {
  const metric = metrics.find((m) => m.name === name);

  if (!metric) return 0;

  const value =
    metric.total_value?.value ??
    metric.values?.[0]?.value ??
    0;

  return Number(value);
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const creators = await prisma.creatorProfile.findMany();

  const results: any[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const creator of creators) {
    try {
      // --------------------------------------------------
      // 1. Latest Raw Snapshot
      // --------------------------------------------------

      const snapshot =
        await prisma.creatorSocialRawSnapshot.findFirst({
          where: {
            creatorId: creator.id,
            platform: "INSTAGRAM",
          },
          orderBy: {
            fetchedAt: "desc",
          },
        });

      if (!snapshot) {
        results.push({
          creatorId: creator.id,
          status: "NO_SNAPSHOT",
        });
        continue;
      }

      const raw = snapshot.rawData as any;

      const profile = raw?.profile ?? {};

      const dailyMetrics =
        raw?.insights?.daily?.data ?? [];

      const totalMetrics =
        raw?.insights?.total?.data ?? [];

      // --------------------------------------------------
      // 2. Extract Values
      // --------------------------------------------------

      const followers =
        Number(profile?.followers_count ?? 0);

      const reach =
        getMetric(dailyMetrics, "reach");

      const followerCount =
        getMetric(
          dailyMetrics,
          "follower_count"
        );

      const likes =
        getMetric(totalMetrics, "likes");

      const comments =
        getMetric(totalMetrics, "comments");

      const shares =
        getMetric(totalMetrics, "shares");

      const saves =
        getMetric(totalMetrics, "saves");

      const replies =
        getMetric(totalMetrics, "replies");

      const profileViews =
        getMetric(
          totalMetrics,
          "profile_views"
        );

      const accountsEngaged =
        getMetric(
          totalMetrics,
          "accounts_engaged"
        );

      const totalInteractions =
        getMetric(
          totalMetrics,
          "total_interactions"
        );

      // --------------------------------------------------
      // 3. Industry Standard Metrics
      // --------------------------------------------------

      const engagements =
        likes +
        comments +
        shares +
        saves +
        replies;

      const impressions =
        totalInteractions > 0
          ? totalInteractions
          : Math.round(reach * 1.35);

      const engagementRate =
        reach > 0
          ? Number(
              (
                (engagements / reach) *
                100
              ).toFixed(2)
            )
          : 0;

      // --------------------------------------------------
      // 4. Store Daily Analytics
      // --------------------------------------------------

      await prisma.creatorDailyAnalytics.upsert({
        where: {
          creatorId_date: {
            creatorId: creator.id,
            date: today,
          },
        },
        create: {
          creatorId: creator.id,
          date: today,

          followers:
            followers || followerCount,

          reach,
          impressions,

          engagements,

          likes,
          comments,
          shares,
          saves,
          replies,

          profileViews,
        },
        update: {
          followers:
            followers || followerCount,

          reach,
          impressions,

          engagements,

          likes,
          comments,
          shares,
          saves,
          replies,

          profileViews,
        },
      });

      // --------------------------------------------------
      // 5. Previous Daily Row
      // --------------------------------------------------

      const previousDaily =
        await prisma.creatorDailyAnalytics.findFirst({
          where: {
            creatorId: creator.id,
            date: {
              lt: today,
            },
          },
          orderBy: {
            date: "desc",
          },
        });

      // --------------------------------------------------
      // 6. Calculate Deltas
      // --------------------------------------------------

      const followerDelta =
        previousDaily
          ? followers -
            previousDaily.followers
          : followers;

      const reachDelta =
        reach;

      const impressionsDelta =
        impressions;

      const engagementsDelta =
        engagements;

      const likesDelta =
        likes;

      const commentsDelta =
        comments;

      const sharesDelta =
        shares;

      const savesDelta =
        saves;

      const repliesDelta =
        replies;

      const profileViewsDelta =
        profileViews;

      // --------------------------------------------------
      // 7. Update Full Analytics
      // --------------------------------------------------

      const existingFull =
        await prisma.creatorFullAnalytics.findUnique({
          where: {
            creatorId: creator.id,
          },
        });

      if (!existingFull) {
        await prisma.creatorFullAnalytics.create({
          data: {
            creatorId: creator.id,

            followers,

            reach: reachDelta,
            impressions: impressionsDelta,
            engagements: engagementsDelta,

            likes: likesDelta,
            comments: commentsDelta,
            shares: sharesDelta,
            saves: savesDelta,
            replies: repliesDelta,

            profileViews: profileViewsDelta,

            engagementRate,
          },
        });
      } else {
        await prisma.creatorFullAnalytics.update({
          where: {
            creatorId: creator.id,
          },
          data: {
            followers,

            reach: {
              increment: reachDelta,
            },

            impressions: {
              increment: impressionsDelta,
            },

            engagements: {
              increment: engagementsDelta,
            },

            likes: {
              increment: likesDelta,
            },

            comments: {
              increment: commentsDelta,
            },

            shares: {
              increment: sharesDelta,
            },

            saves: {
              increment: savesDelta,
            },

            replies: {
              increment: repliesDelta,
            },

            profileViews: {
              increment: profileViewsDelta,
            },

            engagementRate,
          },
        });
      }

      results.push({
        creatorId: creator.id,
        username:
          profile?.username ?? null,
        status: "SUCCESS",
      });
    } catch (err: any) {
      console.error(
        "Populate failed",
        creator.id,
        err
      );

      results.push({
        creatorId: creator.id,
        status: "FAILED",
        error: err?.message,
      });
    }
  }

  return NextResponse.json({
    processed: creators.length,
    results,
  });
}