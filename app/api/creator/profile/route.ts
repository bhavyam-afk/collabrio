import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
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

  return NextResponse.json({
    id: creatorProfile.id,
    user: {
      username: creatorProfile.user.username,
    },
    bio: creatorProfile.bio,
    location: creatorProfile.location,
    niche: creatorProfile.niche,
    profilePicUrl: creatorProfile.profilePicUrl,
    introClipUrl: creatorProfile.introClipUrl,
    category: creatorProfile.category,
    nicheTags: creatorProfile.nicheTags,
    portfolio: creatorProfile.portfolio,
    mlScore: creatorProfile.mlScore,
    followerCount: creatorProfile.followerCount,
    collaborations: creatorProfile.collaborations.map((item) => ({
      id: item.id,
      brand: item.brand?.user.username || "Brand",
      campaign: item.package?.title || "Campaign",
      updatedAt: item.updatedAt.toISOString(),
      logoUrl: item.brand?.logoUrl || null,
      initials: (item.brand?.user.username || "BR").slice(0, 2).toUpperCase(),
      status: item.collabStatus,
    })),
  })
}
