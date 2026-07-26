import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import { processAnalyticsJobs } from "@/clients/analyticsQueue"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const accounts = await prisma.creatorSocialAccount.findMany({
    where: {
      platform: "INSTAGRAM",
      connected: true,
    },
  })

  const eligible = accounts.filter((a) => a.igAccountId)

  // Create AnalyticsJob rows in a batch transaction
  const jobs = await prisma.$transaction(
    eligible.map((a) =>
      prisma.analyticsJob.create({
        data: {
          creatorId: a.creatorId,
          igAccountId: a.igAccountId!,
          status: "QUEUED",
        },
      })
    )
  )

  console.log(
    `[SNAPSHOT_PRODUCER] Created ${jobs.length} analytics jobs for ${accounts.length} accounts`
  )

  // Push to serverless worker route
  await processAnalyticsJobs(jobs.map((j) => j.id))

  return NextResponse.json({
    accountsFound: accounts.length,
    jobsPushed: jobs.length,
  })
}