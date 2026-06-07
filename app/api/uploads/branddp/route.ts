import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import { uploadToS3 } from "@/clients/uploadToS3"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const brandId = formData.get("brandId") as string

    if (!file || !brandId) {
      return NextResponse.json(
        { error: "Missing file or brandId" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop()
    const key = `brands/${brandId}/logo.${ext}`

    const uploadResult = await uploadToS3(
      buffer,
      key,
      file.type || "image/png"
    )

    await prisma.brandProfile.update({
      where: { id: brandId },
      data: { logoUrl: uploadResult.url },
    })

    return NextResponse.json({
      success: true,
      logoUrl : uploadResult.url,
    })
  } catch (err) {
    console.error("Brand logo upload error:", err)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}
