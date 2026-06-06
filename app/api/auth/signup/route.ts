import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import prisma from "@/clients/prisma"

const schema = z.object({
  email:    z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  password: z.string().min(8),
  type:     z.enum(["BRAND", "CREATOR"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const parsed = schema.safeParse({
      email:    body.email?.trim().toLowerCase(),
      username: body.username?.trim(),
      password: body.password,
      type:     body.type,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 }
      )
    }

    const { email, username, password, type } = parsed.data

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
          data: { userId: newUser.id },
        })
      } else {
        await tx.creatorProfile.create({
          data: {
            userId: newUser.id,
          },
        })
      }

      return newUser
    })

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