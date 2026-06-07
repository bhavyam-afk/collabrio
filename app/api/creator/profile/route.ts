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

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      collaborations: {
        include: {
          brand: {
            include: {
              user: true,
            },
          },
          package: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
    },
  })

  if (!creatorProfile) {
    return NextResponse.json(
      { error: "Creator profile not found" },
      { status: 404 }
    )
  }
  const bucket = process.env.AWS_S3_BUCKET

  // Generate presigned URLs for any S3-hosted resources so the client can fetch them
  let profilePicUrl = creatorProfile.profilePicUrl || null
  let introClipUrl = creatorProfile.introClipUrl || null

  if (bucket) {
    if (profilePicUrl) {
      try {
        const parsed = new URL(profilePicUrl)
        if (parsed.hostname.includes(bucket)) {
          const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
          profilePicUrl = await getPresignedUrl(key, 60 * 60)
        }
      } catch (e) {
        // ignore and keep original URL
      }
    }

    if (introClipUrl) {
      try {
        const parsed = new URL(introClipUrl)
        if (parsed.hostname.includes(bucket)) {
          const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
          introClipUrl = await getPresignedUrl(key, 60 * 60)
        }
      } catch (e) {
        // ignore
      }
    }
  }

  const collaborations = await Promise.all(
    creatorProfile.collaborations.map(async (item) => {
      let logoUrl = item.brand?.logoUrl || null
      if (logoUrl && bucket) {
        try {
          const parsed = new URL(logoUrl)
          if (parsed.hostname.includes(bucket)) {
            const key = decodeURIComponent(parsed.pathname.replace(/^\//, ""))
            logoUrl = await getPresignedUrl(key, 60 * 60)
          }
        } catch (e) {
          // ignore
        }
      }

      return {
        id: item.id,
        brand: item.brand?.user.username || "Brand",
        campaign: item.package?.title || "Campaign",
        updatedAt: item.updatedAt.toISOString(),
        logoUrl,
        initials: (item.brand?.user.username || "BR").slice(0, 2).toUpperCase(),
        status: item.collabStatus,
      }
    })
  )

  return NextResponse.json({
    id: creatorProfile.id,
    user: {
      username: creatorProfile.user.username,
    },
    bio: creatorProfile.bio,
    location: creatorProfile.location,
    niche: creatorProfile.niche,
    profilePicUrl,
    introClipUrl,
    category: creatorProfile.category,
    nicheTags: creatorProfile.nicheTags,
    portfolio: creatorProfile.portfolio,
    mlScore: creatorProfile.mlScore,
    followerCount: creatorProfile.followerCount,
    collaborations,
  })
}
