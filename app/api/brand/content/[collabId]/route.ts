import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/clients/prisma"
import { authOptions } from "../../../auth/authOptions"
import { getPresignedUrl } from "@/clients/uploadToS3"
import { TransactionStatus, TransactionType, WalletType, PaymentStatus } from "@prisma/client"
import * as bcrypt from "bcryptjs"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ collabId: string }> }
) {
  const  { collabId } = await context.params
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    const userRole = (session?.user as any)?.role as string | undefined

    if (!userId || userRole !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { brand: true, content: true, package: true },
    })

    if (!collaboration) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
    }

    const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } })
    if (!brandProfile || collaboration.brandId !== brandProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const brandPayment = await prisma.transaction.findFirst({
      where: {
        collabId,
        type: TransactionType.BRAND_PAYMENT,
      },
      orderBy: { updatedAt: "desc" },
    })

    const paymentStatus = brandPayment
      ? brandPayment.status === TransactionStatus.COMPLETED
        ? "COMPLETED"
        : brandPayment.status === TransactionStatus.PENDING
          ? "PENDING"
          : "FAILED"
      : "UNPAID"

    const contentDraft = (collaboration.content?.contentDraft as any[]) || []

    const uploadedFiles = await Promise.all(
      contentDraft.map(async (item) => {
        if (item?.key) {
          const preview = await getPresignedUrl(item.key, 60 * 60)
          return { url: item.url, previewUrl: preview, type: item.type }
        }
        if (item?.url) return { url: item.url, type: item.type }
        return null
      })
    )

    const validFiles = (uploadedFiles || []).filter((f) => f !== null) as { url: string; previewUrl?: string; type: string }[]
    const computedStatus = validFiles.length === 0 ? "NOT_SUBMITTED" : (collaboration.content?.contentStatus || "SUBMITTED")

    return NextResponse.json({
      collabId: collaboration.id,
      collabStatus: collaboration.collabStatus,
      package: {
        id: collaboration.package.id,
        title: collaboration.package.title,
        mediaType: collaboration.package.mediaType,
        price: String(collaboration.package.price),
      },
      contentStatus: computedStatus,
      paymentStatus: collaboration.PaymentStatus,
      paymentState: collaboration.PaymentStatus,
      uploadedFiles: validFiles,
      brandFeedback: collaboration.content?.brandFeedback || null,
      revisionCount: collaboration.content?.revisionCount || 0,
      transactionStatus: paymentStatus,
    })
  } catch (error) {
    console.error("Error fetching brand content:", error)
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ collabId: string }> }) {
  const { collabId } = await context.params
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    const userRole = (session?.user as any)?.role as string | undefined

    if (!userId || userRole !== "BRAND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } })

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 })
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: {
        content: true,
        package: true,
        creator: { include: { user: { include: { wallet: true } } } },
        brand: { include: { user: { include: { wallet: true } } } },
      },
    })

    if (!collaboration || collaboration.brandId !== brandProfile.id) {
      return NextResponse.json({ error: "Collaboration not found or access denied" }, { status: 404 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const action = String(body.action || "").trim().toLowerCase()

    if (!["approve", "request_improvement"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // ─── APPROVE: Release escrow and pay creator ─────────────────────────────

    if (action === "approve") {
      if (!collaboration.content) {
        return NextResponse.json({ error: "No content submitted for approval" }, { status: 400 })
      }

      if (collaboration.content.contentStatus === "APPROVED") {
        return NextResponse.json({ success: true, contentStatus: "APPROVED" })
      }

      const packagePrice = Number(collaboration.package?.price || 0)
      const platformFeePercent = 0.1 // 10%
      const platformFee = Math.round(packagePrice * platformFeePercent * 100) / 100
      const creatorShare = packagePrice - platformFee

      const creatorWallet = collaboration.creator?.user?.wallet
      let platformWallet = await prisma.wallet.findFirst({
        where: { walletType: WalletType.PLATFORM },
      })

      if (!creatorWallet) {
        return NextResponse.json({ error: "Creator wallet not found" }, { status: 400 })
      }

      // Create platform wallet if it doesn't exist
      if (!platformWallet) {
        // Find or create platform system user
        let platformUser = await prisma.user.findFirst({
          where: { email: "platform@collabrio.local" },
        })

        if (!platformUser) {
          platformUser = await prisma.user.create({
            data: {
              email: "platform@collabrio.local",
              username: "collabrio_platform",
              passwordHash: await bcrypt.hash("PlatformAdmin@2026", 10),
              userType: "BRAND",
              onboarding: "COMPLETE",
            },
          })
        }

        platformWallet = await prisma.wallet.create({
          data: {
            userId: platformUser.id,
            walletType: WalletType.PLATFORM,
            currentBalance: 0,
            pendingBalance: 0,
            totalEarned: 0,
            totalSpent: 0,
          },
        })
      }

      // Transaction: release escrow and distribute earnings
      const updated = await prisma.$transaction(async (tx) => {
        // Update content to approved
        const contentUpdate = await tx.packageCollaboration.update({
          where: { collabId },
          data: {
            contentStatus: "APPROVED",
            draftApprovedAt: new Date(),
            PaymentStatus: PaymentStatus.CREATOR_PAID,
          },
        })

        // Update collaboration to completed
        await tx.collaboration.update({
          where: { id: collabId },
          data: {
            collabStatus: "COMPLETED",
            PaymentStatus: PaymentStatus.CREATOR_PAID,
          },
        })

        // Release escrow from platform pending balance
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            pendingBalance: { decrement: packagePrice },
          },
        })

        // Pay creator
        await tx.wallet.update({
          where: { id: creatorWallet.id },
          data: {
            currentBalance: { increment: creatorShare },
            totalEarned: { increment: creatorShare },
          },
        })

        // Platform earns fee
        await tx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            currentBalance: { increment: platformFee },
            totalEarned: { increment: platformFee },
          },
        })

        // Create CREATOR_EARNING transaction (INWALLET status - already in wallet, not pending)
        await tx.transaction.create({
          data: {
            type: TransactionType.CREATOR_EARNING,
            status: TransactionStatus.INWALLET,
            amount: creatorShare,
            fromWalletId: platformWallet.id,
            toWalletId: creatorWallet.id,
            collabId,
          },
        })

        // Create PLATFORM_FEE transaction (COMPLETED - fee is immediately earned)
        await tx.transaction.create({
          data: {
            type: TransactionType.PLATFORM_FEE,
            status: TransactionStatus.COMPLETED,
            amount: platformFee,
            fromWalletId: platformWallet.id,
            toWalletId: platformWallet.id, // Fee stays in platform wallet
            collabId,
          },
        })

        return contentUpdate
      })

      return NextResponse.json({
        success: true,
        contentStatus: updated.contentStatus,
        paymentReleased: true,
        creatorEarnings: creatorShare,
        platformFee,
      })
    }

    // ─── REQUEST IMPROVEMENT: Keep in escrow, don't update PaymentStatus ────

    // request_improvement
    const feedback = String(body.feedback || "").trim()

    const existing = collaboration.content
    if (!existing) {
      return NextResponse.json({ error: "No content to request improvements for" }, { status: 400 })
    }

    const newRevisionCount = (existing.revisionCount || 0) + 1

    const updated = await prisma.packageCollaboration.update({
      where: { collabId },
      data: {
        contentStatus: "IMPROVEMENT_REQUESTED",
        brandFeedback: feedback || null,
        revisionCount: newRevisionCount,
        PaymentStatus: PaymentStatus.PLATFORM_HOLD, // money still locked in escrow
      },
    })

    return NextResponse.json({
      success: true,
      contentStatus: updated.contentStatus,
      revisionCount: updated.revisionCount,
    })
  } catch (error) {
    console.error("Error updating content status:", error)
    return NextResponse.json({ error: "Failed to update content status" }, { status: 500 })
  }
}
