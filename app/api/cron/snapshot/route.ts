import { NextResponse } from "next/server";
import prisma from "@/clients/prisma";

export async function GET(req: Request) {

  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  
  const accounts = await prisma.creatorSocialAccount.findMany({
    where: {
      platform: "INSTAGRAM",
      connected: true,
    },
  });

  const debug: any[] = [];

  for (const account of accounts) {
    try {
      debug.push({
        step: "ACCOUNT_FOUND",
        creatorId: account.creatorId,
        igAccountId: account.igAccountId,
        hasToken: !!account.accessToken,
      });

      if (!account.igAccountId) {
        debug.push({
          step: "NO_IG_ID",
          creatorId: account.creatorId,
        });
        continue;
      }

      const profileRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}` +
          `?fields=username,followers_count,media_count` +
          `&access_token=${account.accessToken}`
      );

      const profile = await profileRes.json();

      debug.push({
        step: "PROFILE_RESPONSE",
        creatorId: account.creatorId,
        profile,
      });

      const dailyRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}/insights` +
          `?metric=reach,follower_count` +
          `&period=day` +
          `&access_token=${account.accessToken}`
      );

      const dailyInsights = await dailyRes.json();

      debug.push({
        step: "DAILY_RESPONSE",
        creatorId: account.creatorId,
        dailyInsights,
      });

      const totalRes = await fetch(
        `https://graph.facebook.com/v19.0/${account.igAccountId}/insights` +
          `?metric=accounts_engaged,profile_views,total_interactions,likes,comments,shares,saves,replies` +
          `&metric_type=total_value` +
          `&period=day` +
          `&access_token=${account.accessToken}`
      );

      const totalInsights = await totalRes.json();

      debug.push({
        step: "TOTAL_RESPONSE",
        creatorId: account.creatorId,
        totalInsights,
      });

      const snapshot =
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
        });

      debug.push({
        step: "SNAPSHOT_SAVED",
        snapshotId: snapshot.id,
      });
    } catch (err: any) {
      debug.push({
        step: "ERROR",
        creatorId: account.creatorId,
        message: err?.message,
        stack: err?.stack,
      });
    }
  }

  return NextResponse.json({
    accountsFound: accounts.length,
    debug,
  });
}