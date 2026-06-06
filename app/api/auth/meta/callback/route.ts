import { NextRequest, NextResponse } from "next/server";

import prisma from "@/clients/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?meta=denied`
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Invalid OAuth response" }, { status: 400 });
  }

  // ─────────────────────────────────────────────
  // 1️⃣ Parse & validate state
  // ─────────────────────────────────────────────
  let username: string;

  try {
    const parsed = JSON.parse(decodeURIComponent(state));
    username = parsed.username;
  } catch {
    return NextResponse.json({ error: "Invalid state payload" }, { status: 400 });
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Exchange code → short lived token
  // ─────────────────────────────────────────────
  const shortRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&redirect_uri=${process.env.META_REDIRECT_URI}` +
      `&code=${code}`
  );

  const shortData = await shortRes.json();
  if (!shortData.access_token) {
    return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Exchange → long lived token
  // ─────────────────────────────────────────────
  const longRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${shortData.access_token}`
  );

  const longData = await longRes.json();
  if (!longData.access_token) {
    return NextResponse.json({ error: "Long token failed" }, { status: 400 });
  }

  const tokenExpiresAt = longData.expires_in
    ? new Date(Date.now() + longData.expires_in * 1000)
    : null;

  // ─────────────────────────────────────────────
  // 4️⃣ Fetch pages → find IG business account
  // ─────────────────────────────────────────────
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,access_token,instagram_business_account&access_token=${longData.access_token}`
  );
  
  const pagesData = await pagesRes.json();
  console.log("PAGES RAW RESPONSE:", JSON.stringify(pagesData, null, 2));
  const page = pagesData?.data?.find(
    (p: any) => p.instagram_business_account?.id && p.access_token
  );

  if (!page) {
    return NextResponse.json(
      { error: "No Instagram business account found" },
      { status: 400 }
    );
  }

  // 🔒 Always fetch creator from DB (never trust OAuth state)
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return NextResponse.json(
      { error: "Creator profile does not exist" },
      { status: 400 }
    )
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  })

  if (!creator) {
    return NextResponse.json(
      { error: "Creator profile does not exist" },
      { status: 400 }
    )
  }


  // ─────────────────────────────────────────────
  // 5️⃣ Store connection (UPSERT)
  // ─────────────────────────────────────────────
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
    igAccountId: page.instagram_business_account.id,
    pageId: page.id,
    tokenExpiresAt,
    connected: true,
  },
  update: {
    accessToken: page.access_token,
    igAccountId: page.instagram_business_account.id,
    pageId: page.id,
    tokenExpiresAt,
    connected: true,
  },
});

  // ─────────────────────────────────────────────
  // 6️⃣ Redirect to dashboard
  // ─────────────────────────────────────────────
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/creator/${encodeURIComponent(username)}/dashboard?meta=connected`
  );
}
