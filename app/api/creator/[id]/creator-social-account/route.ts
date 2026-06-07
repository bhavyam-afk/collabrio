import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/clients/prisma";
import { authOptions } from "@/app/api/auth/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const socialAccount = await prisma.creatorSocialAccount.findFirst({
      where: {
        creatorId: creator.id,
        platform: "INSTAGRAM",
      },
      select: {
        connected: true,
        igAccountId: true,
      },
    });

    return NextResponse.json({
      connected: socialAccount?.connected ?? false,
      igConnected: !!socialAccount?.igAccountId,
    });

  } catch (error) {
    console.error("Creator social account check failed:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}