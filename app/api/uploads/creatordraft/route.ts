import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/authOptions"
import prisma from "@/clients/prisma"
import { uploadToS3, getPresignedUrl } from "@/clients/uploadToS3"
import { PaymentStatus } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.error("No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const collabId = formData.get("collabId") as string
    const file = formData.get("file") as File

    if (!collabId || !file) {
      return NextResponse.json({ error: "Missing collabId or file" }, { status: 400 })
    }

    // 1️⃣ Fetch creator profile and validate session
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: (session.user as any).id },
    })

    if (!creator) {
      console.error("Creator not found for userId:", (session.user as any).id)
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    // 2️⃣ Verify collaboration exists and belongs to creator
    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { content: true, package: true },
    })

    if (!collab) {
      console.error("Collaboration not found:", collabId)
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
    }

    if (collab.creatorId !== creator.id) {
      console.error("Creator unauthorized for this collaboration")
      return NextResponse.json({ error: "Access denied to this collaboration" }, { status: 403 })
    }

    if (collab.collabStatus !== "ACTIVE") {
      console.error("Collaboration not active. Status:", collab.collabStatus)
      return NextResponse.json({ error: "Collaboration is not active" }, { status: 403 })
    }

    // Verify payment has been completed and locked in escrow
    if (!collab.content) {
      return NextResponse.json(
        { error: "Collaboration not initialized. Contact support." },
        { status: 400 }
      )
    }

    // Check PaymentStatus is PLATFORM_HOLD (brand paid, in escrow)
    if (collab.content.PaymentStatus !== PaymentStatus.PLATFORM_HOLD) {
      return NextResponse.json(
        { error: `Upload locked. Payment status: ${collab.content.PaymentStatus}. Expected: ${PaymentStatus.PLATFORM_HOLD}` },
        { status: 403 }
      )
    }

    // Also verify the payment transaction was completed (redundant check for safety)
    const brandPayment = await prisma.transaction.findFirst({
      where: {
        collabId,
        type: "BRAND_PAYMENT",
        status: "COMPLETED",
      },
    })

    if (!brandPayment) {
      return NextResponse.json(
        { error: "Brand payment not found or not completed" },
        { status: 403 }
      )
    }

    // 3️⃣ Validate file
    const maxFileSize = 500 * 1024 * 1024 // 500MB
    const allowedTypes = ["video/mp4", "video/quicktime", "image/jpeg", "image/png", "image/webp"]

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 400 }
      )
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, MOV, JPEG, PNG, WebP" },
        { status: 400 }
      )
    }

    // 4️⃣ Upload file to S3
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-z0-9.-]/gi, "-").toLowerCase()
    const fileKey = `drafts/creators/${creator.id}/collabs/${collab.id}/${timestamp}-${safeFilename}`

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await uploadToS3(fileBuffer, fileKey, file.type)
    const s3Url = uploadResult.url
    const s3Key = uploadResult.key
    // generate a short-lived preview URL for the creator to preview the uploaded content
    const previewUrl = await getPresignedUrl(s3Key, 60 * 60) // 1 hour

    // 5️⃣ Determine content type and update database
    const contentType = file.type.startsWith("video") ? "video" : "image"

    let packageCollab = collab.content

    if (!packageCollab) {
      // Create new PackageCollaboration if it doesn't exist
      packageCollab = await prisma.packageCollaboration.create({
        data: {
          collabId,
          packageId: collab.packageId,
          contentStatus: "SUBMITTED",
          contentDraft: [{ url: s3Url, key: s3Key, type: contentType }],
          draftSubmittedAt: new Date(),
        },
      })
    } else {
      // Append to existing content draft
      const existingContent = (packageCollab.contentDraft as any[]) || []
      const updatedContent = [...existingContent, { url: s3Url, key: s3Key, type: contentType }]

      packageCollab = await prisma.packageCollaboration.update({
        where: { collabId },
        data: {
          contentStatus: "SUBMITTED",
          contentDraft: updatedContent,
          draftSubmittedAt: new Date(),
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        fileUrl: s3Url,
        fileName: file.name,
        fileType: file.type,
        contentType,
        previewUrl,
        message: "Content uploaded successfully",
        collaboration: {
          id: collab.id,
          status: collab.collabStatus,
          contentStatus: packageCollab.contentStatus,
          uploadedCount: ((packageCollab.contentDraft as any[]) || []).length,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { collabId, fileIndex } = await req.json()

    if (!collabId || fileIndex === undefined) {
      return NextResponse.json({ error: "Missing collabId or fileIndex" }, { status: 400 })
    }

    // Fetch creator profile and validate session
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: (session.user as any).id },
    })

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    // Verify collaboration exists and belongs to creator
    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: { content: true },
    })

    if (!collab) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
    }

    if (collab.creatorId !== creator.id) {
      return NextResponse.json({ error: "Access denied to this collaboration" }, { status: 403 })
    }

    if (!collab.content) {
      return NextResponse.json({ error: "No content found" }, { status: 404 })
    }

    // Check if content is approved - prevent deletion
    if (collab.content.contentStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot remove approved content. Contact the brand if changes are needed." },
        { status: 403 }
      )
    }

    // Get current contentDraft array
    const contentDraft = (collab.content.contentDraft as any[]) || []

    // Validate fileIndex
    if (fileIndex < 0 || fileIndex >= contentDraft.length) {
      return NextResponse.json({ error: "Invalid file index" }, { status: 400 })
    }

    // Remove the file at the specified index
    contentDraft.splice(fileIndex, 1)

    // Update PackageCollaboration with the modified array
    await prisma.packageCollaboration.update({
      where: { collabId },
      data: {
        contentDraft: contentDraft.length === 0 ? [] : contentDraft,
        // If no files remain, reset status to NOT_SUBMITTED
        contentStatus: contentDraft.length === 0 ? "NOT_SUBMITTED" : "SUBMITTED",
      },
    })

    return NextResponse.json({ success: true, fileCount: contentDraft.length })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
