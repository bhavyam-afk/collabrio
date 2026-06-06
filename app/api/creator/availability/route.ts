import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "../../../../clients/prisma";
import { authOptions } from "../../auth/authOptions";
import type { AvailabilityStatus } from "@prisma/client";

const VALID_STATUSES: AvailabilityStatus[] = ["AVAILABLE", "UNAVAILABLE", "TENTATIVE"];

const normalizeDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const serializeAvailability = (availability: { date: Date; status: AvailabilityStatus; reason: string | null }) => ({
  date: availability.date.toISOString().slice(0, 10),
  status: availability.status,
  reason: availability.reason,
});

async function getCreatorProfile(userId: string) {
  return prisma.creatorProfile.findUnique({ where: { userId } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "CREATOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const creator = await getCreatorProfile(userId);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const dateQuery = url.searchParams.get("date");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (dateQuery) {
      const day = normalizeDate(dateQuery);
      if (!day) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }

      const availability = await prisma.creatorAvailability.findUnique({
        where: { creatorId_date: { creatorId: creator.id, date: day } },
      });

      const status = availability?.status ?? "AVAILABLE";
      const available = status !== "UNAVAILABLE";

      return NextResponse.json({ date: day.toISOString().slice(0, 10), status, available, reason: availability?.reason ?? null }, { status: 200 });
    }

    if (!start || !end) {
      return NextResponse.json({ error: "date or start/end query params are required" }, { status: 400 });
    }

    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const availability = await prisma.creatorAvailability.findMany({
      where: {
        creatorId: creator.id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ availability: availability.map(serializeAvailability) }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// POST: upsert a single availability date
// body: { date: string, status: 'AVAILABLE' | 'UNAVAILABLE' | 'TENTATIVE', reason?: string }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userRole !== "CREATOR") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const creator = await getCreatorProfile(userId);
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const date = String(body.date || "").trim();
    const status = String(body.status || "").trim().toUpperCase() as AvailabilityStatus;
    const reason = body.reason ? String(body.reason).trim() : null;

    if (!date || !status) {
      return NextResponse.json({ error: "date and status are required" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const day = normalizeDate(date);
    if (!day) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const upserted = await prisma.creatorAvailability.upsert({
      where: { creatorId_date: { creatorId: creator.id, date: day } },
      update: { status, reason },
      create: { creatorId: creator.id, date: day, status, reason },
    });

    return NextResponse.json({ availability: serializeAvailability(upserted) }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upsert availability" }, { status: 500 });
  }
}
