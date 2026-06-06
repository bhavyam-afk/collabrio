import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
import { authOptions } from "../../auth/authOptions"
import type { CollabStatus } from "@prisma/client"

const VALID_STATUS = "ACTIVE" as CollabStatus

async function getCreatorProfile(userId: string) {
  return prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true },
  })
}

type ValidationResult =
  | { status: 200; creatorProfile: { id: string; userId: string } }
  | { status: 401 | 403 | 404; body: { error: string } }

async function validateCreatorSession(): Promise<ValidationResult> {
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

const serializeCollaboration = (collab: {
  id: string
  collabStatus: CollabStatus
  createdAt: Date
  updatedAt: Date
  package: {
    id: string
    title: string
    thumbnailUrl: string | null
    mediaType: string
    price: any
  }
  brand: {
    user: {
      username: string
      email: string
    }
  }
}) => ({
  id: collab.id,
  status: collab.collabStatus,
  createdAt: collab.createdAt.toISOString(),
  updatedAt: collab.updatedAt.toISOString(),
  package: {
    id: collab.package.id,
    title: collab.package.title,
    thumbnailUrl: collab.package.thumbnailUrl,
    mediaType: collab.package.mediaType,
    price: String(collab.package.price),
  },
  brand: {
    username: collab.brand.user.username,
    email: collab.brand.user.email,
  },
})

export async function GET(req: NextRequest) {
  const validation = await validateCreatorSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const creatorProfile = validation.creatorProfile

  const [pendingRequests, activeCollaborations, cancelledCollaborations, completedCollaborations, wallet] = await Promise.all([
    prisma.collaboration.findMany({
      where: { creatorId: creatorProfile.id, collabStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        package: {
          select: { id: true, title: true, thumbnailUrl: true, mediaType: true, price: true },
        },
        brand: {
          select: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    }),
    prisma.collaboration.findMany({
      where: { creatorId: creatorProfile.id, collabStatus: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        package: {
          select: { id: true, title: true, thumbnailUrl: true, mediaType: true, price: true },
        },
        brand: {
          select: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    }),
    prisma.collaboration.findMany({
      where: { creatorId: creatorProfile.id, collabStatus: "CANCELLED" },
      orderBy: { updatedAt: "desc" },
      include: {
        package: {
          select: { id: true, title: true, thumbnailUrl: true, mediaType: true, price: true },
        },
        brand: {
          select: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    }),
    prisma.collaboration.findMany({
      where: { creatorId: creatorProfile.id, collabStatus: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      include: {
        package: {
          select: { id: true, title: true, thumbnailUrl: true, mediaType: true, price: true },
        },
        brand: {
          select: {
            user: {
              select: { username: true, email: true },
            },
          },
        },
      },
    }),
    prisma.wallet.findUnique({
      where: { userId: creatorProfile.userId },
      select: { totalEarned: true },
    }),
  ])

  return NextResponse.json({
    pendingRequests: pendingRequests.map(serializeCollaboration),
    acceptedCollaborations: activeCollaborations.map(serializeCollaboration),
    cancelledCollaborations: cancelledCollaborations.map(serializeCollaboration),
    completedCollaborations: completedCollaborations.map(serializeCollaboration),
    counts: {
      pendingRequests: pendingRequests.length,
      acceptedCollaborations: activeCollaborations.length,
      cancelledCollaborations: cancelledCollaborations.length,
      completedCollaborations: completedCollaborations.length,
    },
    totalEarned: wallet?.totalEarned ? Number(wallet.totalEarned) : 0,
  })
}

export async function PATCH(req: NextRequest) {
  const validation = await validateCreatorSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const creatorProfile = validation.creatorProfile

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const collabId = String(body.collabId || "").trim()
  if (!collabId) {
    return NextResponse.json({ error: "collabId is required" }, { status: 400 })
  }

  const existingCollab = await prisma.collaboration.findUnique({
    where: { id: collabId },
    include: { package: true, content: true },
  })

  if (!existingCollab || existingCollab.creatorId !== creatorProfile.id) {
    return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
  }

  if (existingCollab.collabStatus !== "PENDING") {
    return NextResponse.json({ error: "Only pending requests can be accepted" }, { status: 400 })
  }

  if (!existingCollab.content) {
    await prisma.packageCollaboration.create({
      data: {
        collabId,
        packageId: existingCollab.packageId,
        contentStatus: "NOT_SUBMITTED",
      },
    })
  }

  const updated = await prisma.collaboration.update({
    where: { id: collabId },
    data: { collabStatus: VALID_STATUS },
    include: {
      package: {
        select: { id: true, title: true, thumbnailUrl: true, mediaType: true, price: true },
      },
      brand: {
        select: {
          user: {
            select: { username: true, email: true },
          },
        },
      },
    },
  })

  return NextResponse.json({ collaboration: serializeCollaboration(updated) })
}
