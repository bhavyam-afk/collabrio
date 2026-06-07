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
    const location = formData.get("location")?.toString().trim() || null
    const niche = formData.get("niche")?.toString().trim() || null
    const category = formData.get("category")?.toString().trim() || "NANO"
    const followerCount = parseInt(formData.get("followerCount")?.toString() || "0", 10)
    const nicheTags = formData.get("nicheTags")?.toString()
      .split(",").map((tag) => tag.trim()).filter(Boolean) || []
    const file = formData.get("profilePic") as File | null

    let profilePicUrl: string | null = null
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
      const key = `onboarding/creators/${username}/profile-${Date.now()}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToS3(buffer, key, file.type)
      profilePicUrl = result.url
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType: "CREATOR",
          onboarding: "COMPLETE",
        },
      })

      await tx.wallet.create({
        data: {
          userId: user.id,
          walletType: "CREATOR",
        },
      })

      await tx.creatorProfile.create({
        data: {
          userId: user.id,
          bio,
          location,
          niche,
          category: category as any,
          nicheTags,
          followerCount: isNaN(followerCount) ? 0 : followerCount,
          profilePicUrl,
        },
      })
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[ONBOARDING/CREATOR]", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
