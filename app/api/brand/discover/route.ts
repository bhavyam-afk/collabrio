import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
import { authOptions } from "../../auth/authOptions"

async function getBrandProfile(userId: string) {
  return prisma.brandProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
}

async function validateBrandSession() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined
  const userRole = (session?.user as any)?.role as string | undefined

  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } }
  }

  if (userRole !== "BRAND") {
    return { status: 403, body: { error: "Access denied" } }
  }

  const brandProfile = await getBrandProfile(userId)
  if (!brandProfile) {
    return { status: 404, body: { error: "Brand profile not found" } }
  }

  return { status: 200, brandProfile }
}

const serializePackage = (pkg: {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  mediaType: string
  deliverables: string[]
  deliveryTimeDays: number
  price: any
  creator: {
    user: {
      username: string
    }
    profilePicUrl: string | null
    niche: string | null
  }
}) => ({
  id: pkg.id,
  title: pkg.title,
  description: pkg.description,
  thumbnailUrl: pkg.thumbnailUrl,
  mediaType: pkg.mediaType,
  deliverables: pkg.deliverables,
  deliveryTimeDays: pkg.deliveryTimeDays,
  price: String(pkg.price),
  creator: {
    username: pkg.creator.user.username,
    niche: pkg.creator.niche,
    profilePicUrl: pkg.creator.profilePicUrl,
  },
})

export async function GET(req: NextRequest) {
  const validation = await validateBrandSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const brandProfile = validation.brandProfile!

  const packages = await prisma.package.findMany({
    where: {
      packageStatus: "ACTIVE",
      NOT: {
        collaborations: {
          some: {
            brandId: brandProfile.id,
            collabStatus: { in: ["PENDING", "ACTIVE"] },
          },
        },
      },
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      mediaType: true,
      deliverables: true,
      deliveryTimeDays: true,
      price: true,
      creator: {
        select: {
          user: { select: { username: true } },
          profilePicUrl: true,
          niche: true,
        },
      },
    },
  })

  return NextResponse.json({ packages: packages.map(serializePackage) })
}

export async function POST(req: NextRequest) {
  const validation = await validateBrandSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const brandProfile = validation.brandProfile!
  let body: any

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const packageId = String(body.packageId || "").trim()
  if (!packageId) {
    return NextResponse.json({ error: "Package ID is required" }, { status: 400 })
  }

  const targetPackage = await prisma.package.findFirst({
    where: { id: packageId, packageStatus: "ACTIVE" },
    select: { id: true, creatorId: true },
  })

  if (!targetPackage) {
    return NextResponse.json({ error: "Package not available" }, { status: 404 })
  }

  if (targetPackage.creatorId === brandProfile.id) {
    return NextResponse.json({ error: "Cannot request your own package" }, { status: 400 })
  }

  const existingRequest = await prisma.collaboration.findFirst({
    where: {
      brandId: brandProfile.id,
      packageId,
      creatorId: targetPackage.creatorId,
      collabStatus: { in: ["PENDING", "ACTIVE"] },
    },
  })

  if (existingRequest) {
    return NextResponse.json({ error: "You have already requested this package." }, { status: 400 })
  }

  await prisma.collaboration.create({
    data: {
      creatorId: targetPackage.creatorId,
      brandId: brandProfile.id,
      packageId,
      collabStatus: "PENDING",
    },
  })

  return NextResponse.json({ success: true })
}
