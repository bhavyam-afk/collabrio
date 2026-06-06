import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
import { authOptions } from "../../auth/authOptions"
import type { PackageStatus } from "@prisma/client"

const MAX_ACTIVE_PACKAGES = 3

async function getCreatorProfile(userId: string) {
  return prisma.creatorProfile.findUnique({
    where: { userId },
  })
}

async function validateSession(request: NextRequest) {
  const session = await getServerSession(authOptions)

  const userId = (session?.user as any)?.id as string | undefined
  const userRole = (session?.user as any)?.role as string | undefined

  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } }
  }

  if (userRole !== "CREATOR") {
    return { status: 403, body: { error: "Access denied" } }
  }

  const creatorProfile = await getCreatorProfile(userId)
  if (!creatorProfile) {
    return { status: 404, body: { error: "Creator profile not found" } }
  }

  return { status: 200, creatorProfile }
}

export async function GET(req: NextRequest) {
  const validation = await validateSession(req)
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const creatorProfile = validation.creatorProfile!
  const packages = await prisma.package.findMany({
    where: {
      creatorId: creatorProfile.id,
      packageStatus: { not: "DELETED" },
    },
    orderBy: { title: "asc" },
  })

  return NextResponse.json({
    packages: packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      thumbnailUrl: pkg.thumbnailUrl,
      mediaType: pkg.mediaType,
      deliverables: pkg.deliverables,
      deliveryTimeDays: pkg.deliveryTimeDays,
      price: pkg.price.toString(),
      packageStatus: pkg.packageStatus,
    })),
    activeCount: packages.filter((pkg) => pkg.packageStatus === "ACTIVE").length,
    maxActivePackages: MAX_ACTIVE_PACKAGES,
  })
}

export async function POST(req: NextRequest) {
  const validation = await validateSession(req)
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const creatorProfile = validation.creatorProfile!
  let body: any

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const title = String(body.title || "").trim()
  const mediaType = String(body.mediaType || "").trim()
  const description = body.description ? String(body.description).trim() : null
  const thumbnailUrl = body.thumbnailUrl ? String(body.thumbnailUrl).trim() : null
  const deliveryTimeDays = Number(body.deliveryTimeDays)
  const priceValue = Number(body.price)
  const rawDeliverables = String(body.deliverables || "").trim()
  const requestedStatus = String(body.packageStatus || "DRAFT").toUpperCase()

  const deliverables = rawDeliverables
    .split(/\r?\n|,/) 
    .map((item) => item.trim())
    .filter(Boolean)

  if (!title) {
    return NextResponse.json({ error: "Package title is required." }, { status: 400 })
  }

  if (!mediaType) {
    return NextResponse.json({ error: "Package media type is required." }, { status: 400 })
  }

  if (!deliverables.length) {
    return NextResponse.json({ error: "Enter at least one deliverable." }, { status: 400 })
  }

  if (!Number.isInteger(deliveryTimeDays) || deliveryTimeDays <= 0) {
    return NextResponse.json({ error: "Delivery time must be a positive number." }, { status: 400 })
  }

  if (Number.isNaN(priceValue) || priceValue <= 0) {
    return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 })
  }

  const status = (requestedStatus === "ACTIVE" ? "ACTIVE" : "DRAFT") as PackageStatus

  if (status === "ACTIVE") {
    const activeCount = await prisma.package.count({
      where: { creatorId: creatorProfile.id, packageStatus: "ACTIVE" },
    })

    if (activeCount >= MAX_ACTIVE_PACKAGES) {
      return NextResponse.json(
        {
          error: `Only ${MAX_ACTIVE_PACKAGES} active packages are allowed. Set this package to draft first, or deactivate another package before activating.`,
        },
        { status: 400 }
      )
    }
  }

  const createdPackage = await prisma.package.create({
    data: {
      creatorId: creatorProfile.id,
      title,
      mediaType,
      description,
      thumbnailUrl,
      deliverables,
      deliveryTimeDays,
      price: priceValue.toString(),
      packageStatus: status,
    },
  })

  return NextResponse.json(
    {
      package: {
        id: createdPackage.id,
        title: createdPackage.title,
        description: createdPackage.description,
        thumbnailUrl: createdPackage.thumbnailUrl,
        mediaType: createdPackage.mediaType,
        deliverables: createdPackage.deliverables,
        deliveryTimeDays: createdPackage.deliveryTimeDays,
        price: createdPackage.price.toString(),
        packageStatus: createdPackage.packageStatus,
        },
    },
    { status: 201 }
  )
}

export async function PATCH(req: NextRequest) {
  const validation = await validateSession(req)
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const creatorProfile = validation.creatorProfile!
  let body: any

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const packageId = String(body.packageId || "").trim()
  const status = String(body.status || "").toUpperCase() as PackageStatus
  const allowedStatuses: PackageStatus[] = ["ACTIVE", "DRAFT", "DELETED"]

  if (!packageId) {
    return NextResponse.json({ error: "Package ID is required." }, { status: 400 })
  }

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid package status." }, { status: 400 })
  }

  const existingPackage = await prisma.package.findUnique({ where: { id: packageId } })
  if (!existingPackage || existingPackage.creatorId !== creatorProfile.id) {
    return NextResponse.json({ error: "Package not found." }, { status: 404 })
  }

  if (existingPackage.packageStatus === status) {
    return NextResponse.json({ error: `Package is already ${status.toLowerCase()}.` }, { status: 400 })
  }

  if (status === "ACTIVE") {
    const activeCount = await prisma.package.count({
      where: { creatorId: creatorProfile.id, packageStatus: "ACTIVE" },
    })

    if (activeCount >= MAX_ACTIVE_PACKAGES) {
      return NextResponse.json(
        {
          error: `Only ${MAX_ACTIVE_PACKAGES} active packages are allowed. Deactivate one of your active packages before switching this one on.`,
        },
        { status: 400 }
      )
    }
  }

  const updatedPackage = await prisma.package.update({
    where: { id: packageId },
    data: { packageStatus: status },
  })

  return NextResponse.json({
    package: {
      id: updatedPackage.id,
      title: updatedPackage.title,
      description: updatedPackage.description,
      thumbnailUrl: updatedPackage.thumbnailUrl,
      mediaType: updatedPackage.mediaType,
      deliverables: updatedPackage.deliverables,
      deliveryTimeDays: updatedPackage.deliveryTimeDays,
      price: updatedPackage.price.toString(),
      packageStatus: updatedPackage.packageStatus,
    },
  })
}
