import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import bcrypt from "bcryptjs"
import { uploadToS3 } from "@/clients/uploadToS3"
import { z } from "zod"

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]

const accountSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscores only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    const parsed = accountSchema.safeParse({
      email: formData.get("email")?.toString().trim().toLowerCase(),
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, username, password } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email already registered" : "Username already taken" },
        { status: 409 }
      )
    }

    const bio = formData.get("bio")?.toString().trim() || null
    const industryTags = formData.get("industryTags")?.toString()
      .split(",").map((tag) => tag.trim()).filter(Boolean) || []
    const website = formData.get("website")?.toString().trim() || null
    const instagram = formData.get("instagram")?.toString().trim() || null
    const twitter = formData.get("twitter")?.toString().trim() || null
    const file = formData.get("logo") as File | null

    let logoUrl: string | null = null
    if (file && file.size > 0) {
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, or WebP allowed" },
          { status: 400 }
        )
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be under 10MB" },
          { status: 400 }
        )
      }
      const key = `onboarding/brands/${username}/logo-${Date.now()}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToS3(buffer, key, file.type, true)
      logoUrl = result.url
    }

    const socialLinks: Array<{ platform: string; url: string }> = []
    if (website) socialLinks.push({ platform: "website", url: website })
    if (instagram) socialLinks.push({ platform: "instagram", url: instagram })
    if (twitter) socialLinks.push({ platform: "twitter", url: twitter })

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType: "BRAND",
          onboarding: "COMPLETE",
        },
      })

      await tx.wallet.create({
        data: {
          userId: user.id,
          walletType: "BRAND",
        },
      })

      await tx.brandProfile.create({
        data: {
          userId: user.id,
          bio,
          industryTags,
          logoUrl,
          socialLinks: socialLinks.length > 0 ? socialLinks : [],
        },
      })
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[ONBOARDING/BRAND]", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
