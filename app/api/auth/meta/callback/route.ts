import { NextRequest, NextResponse } from "next/server"
import prisma from "@/clients/prisma"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const state = url.searchParams.get("state")

  console.log("========== META CALLBACK ==========")

  if (error) {
    console.error("META OAUTH ERROR:", error)

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?meta=denied`
    )
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Invalid OAuth response" },
      { status: 400 }
    )
  }

  let username: string

  try {
    const parsed = JSON.parse(decodeURIComponent(state))
    username = parsed.username

    console.log("STATE:", parsed)
  } catch (err) {
    console.error("STATE PARSE ERROR:", err)

    return NextResponse.json(
      { error: "Invalid state payload" },
      { status: 400 }
    )
  }

  // =====================================================
  // Exchange code -> short token
  // =====================================================

  const shortRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&redirect_uri=${process.env.META_REDIRECT_URI}` +
      `&code=${code}`
  )

  const shortData = await shortRes.json()

  console.log(
    "SHORT TOKEN RESPONSE:",
    JSON.stringify(shortData, null, 2)
  )

  if (!shortData.access_token) {
    return NextResponse.json(
      {
        error: "Token exchange failed",
        meta: shortData,
      },
      { status: 400 }
    )
  }

  // =====================================================
  // Exchange short -> long token
  // =====================================================

  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${shortData.access_token}`
  )

  const longData = await longRes.json()

  console.log(
    "LONG TOKEN RESPONSE:",
    JSON.stringify(longData, null, 2)
  )

  if (!longData.access_token) {
    return NextResponse.json(
      {
        error: "Long lived token exchange failed",
        meta: longData,
      },
      { status: 400 }
    )
  }

  const tokenExpiresAt = longData.expires_in
    ? new Date(Date.now() + longData.expires_in * 1000)
    : null

  // =====================================================
  // Fetch Facebook Pages
  // =====================================================

  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts` +
      `?fields=id,name,access_token,instagram_business_account` +
      `&access_token=${longData.access_token}`
  )

  const pagesData = await pagesRes.json()

  console.log(
    "PAGES RESPONSE:",
    JSON.stringify(pagesData, null, 2)
  )

  if (!pagesData?.data?.length) {
    return NextResponse.json(
      {
        error: "No Facebook pages returned",
        pagesData,
      },
      { status: 400 }
    )
  }

  for (const page of pagesData.data) {
    console.log("PAGE FOUND:")
    console.log("PAGE ID:", page.id)
    console.log("PAGE NAME:", page.name)
    console.log(
      "IG ACCOUNT:",
      JSON.stringify(page.instagram_business_account, null, 2)
    )
  }

  const page = pagesData.data.find(
    (p: any) =>
      p.instagram_business_account?.id &&
      p.access_token
  )

  if (!page) {
    return NextResponse.json(
      {
        error:
          "No Facebook Page with linked Instagram Professional account found",
        pagesData,
      },
      { status: 400 }
    )
  }

  // =====================================================
  // Verify Instagram account
  // =====================================================

  const igRes = await fetch(
    `https://graph.facebook.com/v19.0/${page.instagram_business_account.id}` +
      `?fields=id,username,followers_count,media_count` +
      `&access_token=${page.access_token}`
  )

  const igData = await igRes.json()

  console.log(
    "INSTAGRAM ACCOUNT RESPONSE:",
    JSON.stringify(igData, null, 2)
  )

  if (!igData?.id) {
    return NextResponse.json(
      {
        error: "Instagram account lookup failed",
        igData,
      },
      { status: 400 }
    )
  }

  // =====================================================
  // Find creator
  // =====================================================

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 400 }
    )
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: {
      userId: user.id,
    },
  })

  if (!creator) {
    return NextResponse.json(
      { error: "Creator profile not found" },
      { status: 400 }
    )
  }

  // =====================================================
  // Save connection
  // =====================================================

  await prisma.creatorSocialAccount.upsert({
    where: {
      creatorId_platform: {
        creatorId: creator.id,
        platform: "INSTAGRAM",
      },
    },
    create: {
      creatorId: creator.id,
      platform: "INSTAGRAM",
      accessToken: page.access_token,
      igAccountId: igData.id,
      pageId: page.id,
      tokenExpiresAt,
      connected: true,
    },
    update: {
      accessToken: page.access_token,
      igAccountId: igData.id,
      pageId: page.id,
      tokenExpiresAt,
      connected: true,
    },
  })

  console.log("INSTAGRAM ACCOUNT CONNECTED")
  console.log("USERNAME:", igData.username)
  console.log("IG ID:", igData.id)

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/creator/profile?meta=connected`
  )
}