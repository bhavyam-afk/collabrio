import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "../../../../clients/prisma"
import { authOptions } from "../../auth/authOptions"
import type { CollabStatus } from "@prisma/client"
import { PaymentStatus, WalletType, TransactionType, TransactionStatus } from "@prisma/client"

const CANCELLED_STATUS = "CANCELLED" as CollabStatus

async function getBrandProfile(userId: string) {
  return prisma.brandProfile.findUnique({ where: { userId }, select: { id: true } })
}

type ValidationResult =
  | { status: 200; brandProfile: { id: string } }
  | { status: 401 | 403 | 404; body: { error: string } }

async function validateBrandSession(): Promise<ValidationResult> {
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

type BrandCollaboration = {
  id: string
  collabStatus: CollabStatus
  PaymentStatus: PaymentStatus
  createdAt: Date
  updatedAt: Date
  package: {
    id: string
    title: string
    mediaType: string
    deliveryTimeDays: number
    price: any
  }
  creator: {
    user: {
      username: string
      email: string
    }
    niche: string | null
    profilePicUrl: string | null
  }
}

const serializeCollaboration = (collab: BrandCollaboration) => ({
  id: collab.id,
  status: collab.collabStatus,
  paymentStatus: collab.PaymentStatus,
  createdAt: collab.createdAt.toISOString(),
  updatedAt: collab.updatedAt.toISOString(),
  package: {
    id: collab.package.id,
    title: collab.package.title,
    mediaType: collab.package.mediaType,
    deliveryTimeDays: collab.package.deliveryTimeDays,
    price: String(collab.package.price),
  },
  creator: {
    username: collab.creator.user.username,
    email: collab.creator.user.email,
    niche: collab.creator.niche,
    profilePicUrl: collab.creator.profilePicUrl,
  },
})

export async function GET(req: NextRequest) {
  const validation = await validateBrandSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const brandProfile = validation.brandProfile

  const [pendingRequests, activeCollaborations, cancelledCollaborations, completedCollaborations] = await Promise.all([
    prisma.collaboration.findMany({
      where: { brandId: brandProfile.id, collabStatus: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
        creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
      },
    }),
    prisma.collaboration.findMany({
      where: { brandId: brandProfile.id, collabStatus: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
        creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
      },
    }),
    prisma.collaboration.findMany({
      where: { brandId: brandProfile.id, collabStatus: CANCELLED_STATUS },
      orderBy: { updatedAt: "desc" },
      include: {
        package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
        creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
      },
    }),
    prisma.collaboration.findMany({
      where: { brandId: brandProfile.id, collabStatus: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      include: {
        package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
        creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
      },
    }),
  ])

  return NextResponse.json({
    pendingRequests: pendingRequests.map(serializeCollaboration),
    activeCollaborations: activeCollaborations.map(serializeCollaboration),
    cancelledCollaborations: cancelledCollaborations.map(serializeCollaboration),
    completedCollaborations: completedCollaborations.map(serializeCollaboration),
    counts: {
      pendingRequests: pendingRequests.length,
      activeCollaborations: activeCollaborations.length,
      cancelledCollaborations: cancelledCollaborations.length,
      completedCollaborations: completedCollaborations.length,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const validation = await validateBrandSession()
  if (validation.status !== 200) {
    return NextResponse.json(validation.body, { status: validation.status })
  }

  const brandProfile = validation.brandProfile
  let body: any

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const collabId = String(body.collabId || "").trim()
  const action = String(body.action || "").trim().toLowerCase()

  if (!collabId) {
    return NextResponse.json({ error: "collabId is required" }, { status: 400 })
  }

  if (!["withdraw", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const current = await prisma.collaboration.findUnique({
    where: { id: collabId },
    include: {
      content: true,
      package: true,
      brand: { include: { user: { include: { wallet: true } } } },
      creator: { include: { user: { include: { wallet: true } } } },
    },
  })

  if (!current || current.brandId !== brandProfile.id) {
    return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
  }

  if (action === "withdraw" && current.collabStatus !== "PENDING") {
    return NextResponse.json({ error: "Only pending requests can be withdrawn" }, { status: 400 })
  }

  if (action === "cancel") {
    if (current.collabStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Only active collaborations can be cancelled" }, { status: 400 })
    }

    // Cannot cancel if creator has already been paid
    if (
      current.PaymentStatus === PaymentStatus.CREATOR_PAID ||
      current.content?.PaymentStatus === PaymentStatus.CREATOR_PAID
    ) {
      return NextResponse.json({
        error: "Cannot cancel - creator has already been paid. Contact support for dispute.",
        status: 400,
      })
    }

    // If payment was made, handle refund
    if (
      current.PaymentStatus === PaymentStatus.PLATFORM_HOLD ||
      current.content?.PaymentStatus === PaymentStatus.PLATFORM_HOLD
    ) {
      const brandWallet = current.brand?.user?.wallet
      const platformWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.PLATFORM },
      })
      const creatorWallet = current.creator?.user?.wallet

      if (!brandWallet || !platformWallet) {
        return NextResponse.json({ error: "Wallet configuration error" }, { status: 500 })
      }

      const refundAmount = Number(current.package?.price || 0)
      const draftSubmitted = current.content?.contentStatus === "SUBMITTED" || current.content?.contentStatus === "IMPROVEMENT_REQUESTED"
      const creatorCompensation = draftSubmitted ? Math.round(refundAmount * 0.5 * 100) / 100 : 0
      const brandRefund = Math.round((refundAmount - creatorCompensation) * 100) / 100

      // Process refund in transaction
      await prisma.$transaction(async (tx) => {
        // Update collaboration and content status
        await tx.collaboration.update({
          where: { id: collabId },
          data: {
            collabStatus: CANCELLED_STATUS,
            PaymentStatus: PaymentStatus.REFUNDED,
          },
        })

        await tx.packageCollaboration.update({
          where: { collabId },
          data: {
            PaymentStatus: PaymentStatus.REFUNDED,
          },
        })

        // Release escrow
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            pendingBalance: { decrement: refundAmount },
          },
        })

        // Credit brand wallet with the refund amount
        await tx.wallet.update({
          where: { id: brandWallet.id },
          data: {
            currentBalance: { increment: brandRefund },
          },
        })

        if (draftSubmitted && creatorCompensation > 0 && creatorWallet) {
          await tx.wallet.update({
            where: { id: creatorWallet.id },
            data: {
              currentBalance: { increment: creatorCompensation },
              totalEarned: { increment: creatorCompensation },
            },
          })

          await tx.transaction.create({
            data: {
              type: TransactionType.CREATOR_EARNING,
              status: TransactionStatus.INWALLET,
              amount: creatorCompensation,
              fromWalletId: platformWallet.id,
              toWalletId: creatorWallet.id,
              collabId,
            },
          })
        }

        // Create refund transaction
        await tx.transaction.create({
          data: {
            type: TransactionType.REFUND,
            status: TransactionStatus.COMPLETED,
            amount: brandRefund,
            fromWalletId: platformWallet.id,
            toWalletId: brandWallet.id,
            collabId,
          },
        })
      })

      const updated = await prisma.collaboration.findUnique({
        where: { id: collabId },
        include: {
          package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
          creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
        },
      })

      return NextResponse.json({
        collaboration: serializeCollaboration(updated!),
        refundProcessed: true,
        refundAmount,
      })
    }
  }

  // Withdraw (PENDING collaboration) or cancel (no payment made)
  const updated = await prisma.collaboration.update({
    where: { id: collabId },
    data: { collabStatus: CANCELLED_STATUS },
    include: {
      package: { select: { id: true, title: true, mediaType: true, deliveryTimeDays: true, price: true } },
      creator: { select: { user: { select: { username: true, email: true } }, niche: true, profilePicUrl: true } },
    },
  })

  return NextResponse.json({ collaboration: serializeCollaboration(updated) })
}
