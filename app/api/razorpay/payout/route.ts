import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import {
  RazorpayPayoutProvider,
  ProviderNotOnboardedError,
} from "@/clients/payoutProvider"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { collabId, fundAccountId, amountPaise } = body

    if (!collabId) {
      return NextResponse.json(
        { error: "collabId is required" },
        { status: 400 }
      )
    }

    const provider = new RazorpayPayoutProvider()

    // Create saga log before attempting payout
    const saga = await prisma.sagaLog.create({
      data: {
        collabId,
        sagaType: "PAYOUT",
        step: "INITIATE",
        status: "PENDING",
      },
    })

    try {
      const result = await provider.initiatePayout({
        fundAccountId: fundAccountId ?? "",
        amountPaise: amountPaise ?? 0,
        collabId,
      })

      await prisma.sagaLog.update({
        where: { id: saga.id },
        data: { status: "SUCCEEDED", step: "PAYOUT_PROCESSED" },
      })

      return NextResponse.json({
        success: true,
        payoutId: result.payoutId,
      })
    } catch (err) {
      // Compensating action: money was moved into creator.currentBalance when the
      // collaboration was approved — a failed payout must NOT double-debit that balance.
      // Nothing to reverse here since the payout hasn't touched the wallet yet; we only
      // record the failure so the creator can retry once a real provider is onboarded.
      await prisma.sagaLog.update({
        where: { id: saga.id },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message : String(err),
        },
      })

      if (err instanceof ProviderNotOnboardedError) {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }

      return NextResponse.json({ error: "Payout failed" }, { status: 500 })
    }
  } catch (err) {
    console.error("[PAYOUT] Unexpected error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Payouts disabled (demo)." },
    { status: 501 }
  )
}
