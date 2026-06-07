import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
import { getPresignedUrl } from "../../../../clients/uploadToS3"
import { authOptions } from "../../auth/authOptions"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      bio: true,
      industryTags: true,
      logoUrl: true,
      plan: true,
      user: {
        select: {
          username: true,
        },
      },
      collaborations: {
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          collabStatus: true,
          updatedAt: true,
          creator: {
            select: {
              user: { select: { username: true } },
              niche: true,
              profilePicUrl: true,
            },
          },
          package: {
            select: {
              title: true,
              price: true,
              deliveryTimeDays: true,
            },
          },
        },
      },
    },
  })

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 })
  }
  
  let logoUrl = brandProfile.logoUrl || null

  const bucket = process.env.AWS_S3_BUCKET
  if (logoUrl && bucket) {
    try {
      const parsed = new URL(logoUrl)
      // If the URL is hosted on the configured bucket, extract the key and get a presigned URL
      if (parsed.hostname.includes(bucket)) {
        const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
        logoUrl = await getPresignedUrl(key, 60 * 60)
      }
    } catch (e) {
      // ignore and return the raw logoUrl
    }
  }

  const collaborations = await Promise.all(
    brandProfile.collaborations.map(async (item) => {
      let creatorProfilePicUrl = item.creator?.profilePicUrl || null
      if (creatorProfilePicUrl && bucket) {
        try {
          const parsed = new URL(creatorProfilePicUrl)
          if (parsed.hostname.includes(bucket)) {
            const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
            creatorProfilePicUrl = await getPresignedUrl(key, 60 * 60)
          }
        } catch (e) {
          // ignore
        }
      }

      return {
        id: item.id,
        creator: item.creator?.user.username || "Creator",
        creatorNiche: item.creator?.niche || null,
        creatorProfilePicUrl,
        campaign: item.package?.title || "Campaign",
        price: item.package?.price ? String(item.package.price) : null,
        deliveryTimeDays: item.package?.deliveryTimeDays ?? null,
        updatedAt: item.updatedAt.toISOString(),
        initials: (item.creator?.user.username || "CR").slice(0, 2).toUpperCase(),
        status: item.collabStatus,
      }
    })
  )

  return NextResponse.json({
    id: brandProfile.id,
    user: {
      username: brandProfile.user.username,
    },
    bio: brandProfile.bio,
    industryTags: brandProfile.industryTags,
    logoUrl,
    plan: brandProfile.plan,
    collaborations,
  })
}
