import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
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

  return NextResponse.json({
    id: brandProfile.id,
    user: {
      username: brandProfile.user.username,
    },
    bio: brandProfile.bio,
    industryTags: brandProfile.industryTags,
    logoUrl: brandProfile.logoUrl,
    plan: brandProfile.plan,
    collaborations: brandProfile.collaborations.map((item) => ({
      id: item.id,
      creator: item.creator?.user.username || "Creator",
      creatorNiche: item.creator?.niche || null,
      creatorProfilePicUrl: item.creator?.profilePicUrl || null,
      campaign: item.package?.title || "Campaign",
      price: item.package?.price ? String(item.package.price) : null,
      deliveryTimeDays: item.package?.deliveryTimeDays ?? null,
      updatedAt: item.updatedAt.toISOString(),
      initials: (item.creator?.user.username || "CR").slice(0, 2).toUpperCase(),
      status: item.collabStatus,
    })),
  })
}
