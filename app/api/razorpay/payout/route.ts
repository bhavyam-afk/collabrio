import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import prisma from "@/clients/prisma";
import { TransactionStatus } from "@prisma/client";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  const { transactionId } = await req.json();

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!tx || tx.status !== TransactionStatus.PENDING) {
    return new Response("Invalid transaction", { status: 400 });
  }

  // 🔔 fund_account_id should already be saved for creator
  const transferApi = (razorpay as any).transfers;

  if (!transferApi || typeof transferApi.create !== "function") {
    return new Response("Razorpay transfers API unavailable", { status: 500 });
  }

  const transfer: any = await transferApi.create({
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER!,
    fund_account_id: "fa_creator_xxx",
    amount: Number(tx.amount) * 100,
    currency: "INR",
    mode: "UPI",
    purpose: "payout",
    queue_if_low_balance: true,
  });

  // Save Razorpay transfer ID
  await prisma.transaction.update({
    where: { id: tx.id },
    data: {
      externalPaymentId: transfer?.id,
    },
  });

  return NextResponse.json({ success: true });
}
