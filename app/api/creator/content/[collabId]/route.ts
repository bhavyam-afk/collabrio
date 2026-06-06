import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/clients/prisma"
import { authOptions } from "../../../auth/authOptions"
import { getPresignedUrl } from "@/clients/uploadToS3"
import { TransactionStatus, TransactionType } from "@prisma/client"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ collabId: string }> }
) {
  const { collabId } = await context.params
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    const userRole = (session?.user as any)?.role as string | undefined

    if (!userId || userRole !== "CREATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify collaboration exists and belongs to creator
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: {
        creator: true,
        content: true,
      },
    })

    if (!collaboration) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      )
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId },
    })

    if (!creatorProfile || collaboration.creatorId !== creatorProfile.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const brandPayment = await prisma.transaction.findFirst({
      where: {
        collabId,
        type: TransactionType.BRAND_PAYMENT,
        status: TransactionStatus.COMPLETED,
      },
    })

    const contentDraft = (collaboration.content?.contentDraft as any[]) || []
    const uploadedFiles = await Promise.all(
      contentDraft.map(async (item) => {
        if (item.key) {
          const preview = await getPresignedUrl(item.key, 60 * 60)
          return { url: item.url, previewUrl: preview, type: item.type }
        }
        return { url: item.url, type: item.type }
      })
    )

    return NextResponse.json({
      collabId: collaboration.id,
      collabStatus: collaboration.collabStatus,
      contentStatus: collaboration.content?.contentStatus || "NOT_SUBMITTED",
      paymentStatus: collaboration.content?.PaymentStatus || "UNPAID",
      uploadedFiles,
      revisionCount: collaboration.content?.revisionCount || 0,
      feedback: collaboration.content?.brandFeedback || null,
      isPaid: Boolean(brandPayment),
    })
  } catch (error) {
    console.error("Error fetching content status:", error)
    return NextResponse.json(
      { error: "Failed to fetch content status" },
      { status: 500 }
    )
  }
}
