import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "@/clients/prisma"
import { uploadToS3 } from "@/clients/uploadToS3"

const schema = z.object({
  email:    z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  password: z.string().min(8),
  type:     z.enum(["BRAND", "CREATOR"]),
  // optional profile fields
  bio:      z.string().optional(),
  location: z.string().optional(),
  niche:    z.string().optional(),
  instagram:z.string().optional(),
})

export async function POST(req: Request) {
  try {
    let body: any = {}

    // support form-data (with optional file) or JSON
    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      body = {
        email: form.get("email") as string | null,
        username: form.get("username") as string | null,
        password: form.get("password") as string | null,
        type: form.get("type") as string | null,
        bio: form.get("bio") as string | null,
        location: form.get("location") as string | null,
        niche: form.get("niche") as string | null,
        instagram: form.get("instagram") as string | null,
        profilePic: form.get("profilePic") as File | null,
      }
    } else {
      body = await req.json()
    }

    const parsed = schema.safeParse({
      email:    body.email?.trim().toLowerCase(),
      username: body.username?.trim(),
      password: body.password,
      type:     body.type,
      bio:      body.bio,
      location: body.location,
      niche:    body.niche,
      instagram: body.instagram,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      )
    }

    const { email, username, password, type, bio, location, niche, instagram } = parsed.data

    // check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email already registered" : "Username already taken" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType:   type,
          onboarding: "PENDING",
        },
      })

      // wallet belongs to user — no FK on profile needed
      await tx.wallet.create({
        data: {
          userId:     newUser.id,
          walletType: type,
        },
      })

      if (type === "BRAND") {
        await tx.brandProfile.create({
          data: {
            userId: newUser.id,
            bio: bio ?? undefined,
            industryTags: [],
            socialLinks: instagram ? [{ platform: "instagram", url: instagram }] : undefined,
          },
        })
      } else {
        await tx.creatorProfile.create({
          data: {
            userId: newUser.id,
            bio: bio ?? undefined,
            location: location ?? undefined,
            niche: niche ?? undefined,
            profilePicUrl: undefined,
            platformLinks: instagram ? [{ platform: "instagram", url: instagram }] : undefined,
          },
        })
      }

      return newUser
    })

    // If a profile picture was sent as form-data, upload it now and update the profile
    try {
      if (body.profilePic && body.profilePic instanceof File) {
        const file = body.profilePic as File
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const ext = file.name.split('.').pop()
        const key = `${type === 'BRAND' ? 'brands' : 'creators'}/${user.id}/profile.${ext}`

        const uploadResult = await uploadToS3(buffer, key, file.type || 'image/jpeg')

        if (type === 'BRAND') {
          await prisma.brandProfile.update({ where: { userId: user.id }, data: { logoUrl: uploadResult.url } })
        } else {
          await prisma.creatorProfile.update({ where: { userId: user.id }, data: { profilePicUrl: uploadResult.url } })
        }
      }
    } catch (err) {
      console.error('Profile pic upload failed after signup:', err)
      // do not fail signup because of upload; continue
    }

    return NextResponse.json(
      { message: "Signup successful", userId: user.id },
      { status: 201 }
    )

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}