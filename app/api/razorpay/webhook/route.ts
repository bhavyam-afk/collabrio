import prisma from "@/clients/prisma";
import { TransactionStatus } from "@prisma/client";

export async function POST(req: Request) {
  const payload = await req.json();

  const event = payload.event;
  const payout = payload.payload?.payout?.entity;

  if (!payout?.id) return Response.json({ ok: true });

  const tx = await prisma.transaction.findFirst({
    where: { externalPaymentId: payout.id },
  });

  if (!tx) return Response.json({ ok: true });

  // ✅ SUCCESS
  if (event === "payout.processed") {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: TransactionStatus.COMPLETED },
    });
  }

  // ❌ FAILURE → REFUND WALLET
  if (event === "payout.failed") {
    await prisma.$transaction(async (db) => {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: TransactionStatus.FAILED },
      });

      await db.wallet.update({
        where: { id: tx.toWalletId! },
        data: {
          currentBalance: { increment: tx.amount },
        },
      });
    });
  }

  return Response.json({ ok: true });
}
