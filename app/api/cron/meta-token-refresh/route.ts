import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"

/**
 * Meta Token Refresh Cron
 *
 * Scheduled check for expiring Meta (Instagram) tokens. Finds all connected
 * accounts whose token expires within 7 days and re-extends them using the
 * same `fb_exchange_token` grant already used in `auth/meta/callback/route.ts`.
 *
 * This directly fixes the documented gap in cron.md: "if a Meta token is expired
 * or invalid, the snapshot job will fail for that account" — this closes that
 * gap instead of requiring the creator to notice and manually reconnect.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization")

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const expiringSoon = await prisma.creatorSocialAccount.findMany({
    where: {
      platform: "INSTAGRAM",
      connected: true,
      tokenExpiresAt: { lt: sevenDaysFromNow },
    },
  })

  console.log(`[META_REFRESH] Found ${expiringSoon.length} accounts with expiring tokens`)

  let refreshed = 0
  let failed = 0

  for (const account of expiringSoon) {
    try {
      // Long-lived tokens can be re-extended via the same
      // grant_type=fb_exchange_token call already used in auth/meta/callback
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token` +
          `?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}` +
          `&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${account.accessToken}`
      )

      const data = await res.json()

      if (data.access_token) {
        await prisma.creatorSocialAccount.update({
          where: { id: account.id },
          data: {
            accessToken: data.access_token,
            tokenExpiresAt: new Date(
              Date.now() + (data.expires_in ?? 5184000) * 1000
            ),
          },
        })

        refreshed++
        console.log(
          `[META_REFRESH] Token refreshed for creator ${account.creatorId}`
        )
      } else {
        failed++
        console.error(
          `[META_REFRESH] No access_token in response for creator ${account.creatorId}:`,
          data
        )
      }
    } catch (err) {
      failed++
      console.error(
        "[META_REFRESH] Failed for creator",
        account.creatorId,
        err
      )
      // Token lapses silently for now — consider setting connected: false after
      // N failures and publishing a notification so the creator is prompted to reconnect.
    }
  }

  return NextResponse.json({
    checked: expiringSoon.length,
    refreshed,
    failed,
  })
}
