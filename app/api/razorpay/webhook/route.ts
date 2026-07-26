import crypto from "crypto"
import prisma from "@/clients/prisma"
import { TransactionStatus } from "@prisma/client"

export async function POST(req: Request) {
  // ─── Webhook Signature Verification ─────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  const signature = req.headers.get("x-razorpay-signature")

  const rawBody = await req.text()

  if (!webhookSecret) {
    console.error("[WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not set")
    return Response.json({ error: "Configuration error" }, { status: 500 })
  }

  if (!signature) {
    console.error("[WEBHOOK] Missing X-Razorpay-Signature header")
    return Response.json({ error: "Missing signature" }, { status: 401 })
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  if (expectedSignature !== signature) {
    console.error("[WEBHOOK] Invalid signature — rejecting payload")
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }
  
  console.log("[WEBHOOK] Signature verified")

  const payload = JSON.parse(rawBody)

  const event = payload.event
  const payout = payload.payload?.payout?.entity

  if (!payout?.id) return Response.json({ ok: true })

  const tx = await prisma.transaction.findFirst({
    where: { externalPaymentId: payout.id },
  })

  if (!tx) return Response.json({ ok: true })

  // ✅ SUCCESS
  if (event === "payout.processed") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.COMPLETED },
    })

    // Mark any pending saga as succeeded
    await prisma.sagaLog.updateMany({
      where: {
        collabId: tx.collabId ?? undefined,
        sagaType: "PAYOUT",
        status: "PENDING",
      },
      data: { status: "SUCCEEDED" },
    })
  }

  // ❌ FAILURE → REFUND WALLET
  // BUG FIX: restore balance to fromWalletId (the source wallet the payout was
  // debited from), NOT toWalletId (the external bank/UPI destination).
  if (event === "payout.failed") {
    await prisma.$transaction(async (db) => {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: TransactionStatus.FAILED },
      })

      if (tx.fromWalletId) {
        await db.wallet.update({
          where: { id: tx.fromWalletId },
          data: {
            currentBalance: { increment: tx.amount },
          },
        })
      }

      // Mark saga as compensated
      await db.sagaLog.updateMany({
        where: {
          collabId: tx.collabId ?? undefined,
          sagaType: "PAYOUT",
          status: "PENDING",
        },
        data: { status: "COMPENSATED" },
      })
    })
  }

  return Response.json({ ok: true })
}
