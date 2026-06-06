import { NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/clients/prisma"
import { TransactionType, TransactionStatus, WalletType, CollabStatus, PaymentStatus } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      collabId,
    } = body

    console.log("[VERIFY] Received payment verification request:", {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature: razorpay_signature?.substring(0, 10) + "...",
      collabId,
    })

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !collabId
    ) {
      console.error("[VERIFY] Missing payment payload:", {
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_order_id: !!razorpay_order_id,
        razorpay_signature: !!razorpay_signature,
        collabId: !!collabId,
      })
      return NextResponse.json(
        { error: "Missing payment payload" },
        { status: 400 }
      )
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error("[VERIFY] RAZORPAY_KEY_SECRET is not configured")
      return NextResponse.json(
        { error: "Payment gateway not configured (missing secret)" },
        { status: 500 }
      )
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    console.log("[VERIFY] Signature validation:", {
      expected: generatedSignature.substring(0, 10) + "...",
      received: razorpay_signature.substring(0, 10) + "...",
      match: generatedSignature === razorpay_signature,
    })

    if (generatedSignature !== razorpay_signature) {
      console.error("[VERIFY] Invalid signature - verification failed")
      return NextResponse.json(
        { error: "Invalid Razorpay signature" },
        { status: 400 }
      )
    }

    console.log("[VERIFY] Signature validated, checking for existing transaction...")

    const paymentTx = await prisma.transaction.findFirst({
      where: {
        externalOrderId: razorpay_order_id,
        collabId,
      },
    })

    if (paymentTx?.status === TransactionStatus.COMPLETED) {
      console.log("[VERIFY] Payment already verified, returning success")
      return NextResponse.json({ success: true })
    }

    console.log("[VERIFY] Fetching collaboration details...")

    const collab = await prisma.collaboration.findUnique({
      where: { id: collabId },
      include: {
        package: true,
        creator: { include: { user: { include: { wallet: true } } } },
        brand: { include: { user: { include: { wallet: true } } } },
      },
    })

    if (!collab || !collab.package) {
      console.error("[VERIFY] Collaboration not found:", collabId)
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      )
    }

    if (collab.collabStatus !== CollabStatus.ACTIVE) {
      console.error(`[VERIFY] Collaboration ${collabId} status is ${collab.collabStatus}, expected ACTIVE`)
      return NextResponse.json(
        { error: `Payment can only be completed for active collaborations. Current status: ${collab.collabStatus}` },
        { status: 400 }
      )
    }

    const brandWallet = collab.brand?.user?.wallet
    const platformWallet = await prisma.wallet.findFirst({
      where: { walletType: WalletType.PLATFORM },
    })

    if (!brandWallet) {
      console.error("[VERIFY] Brand wallet not found")
      return NextResponse.json(
        { error: "Brand wallet not found" },
        { status: 400 }
      )
    }

    if (!platformWallet) {
      console.error("[VERIFY] Platform wallet missing")
      return NextResponse.json(
        { error: "Platform wallet missing" },
        { status: 500 }
      )
    }

    const totalAmount = Number(collab.package.price)
    console.log("[VERIFY] Processing payment atomically:", {
      amount: totalAmount,
      brandWalletId: brandWallet.id?.substring(0, 8) + "...",
      platformWalletId: platformWallet.id?.substring(0, 8) + "...",
    })

    await prisma.$transaction(async (tx) => {
      // Create or update BRAND_PAYMENT transaction
      const paymentTransaction = paymentTx
        ? await tx.transaction.update({
            where: { id: paymentTx.id },
            data: {
              status: TransactionStatus.COMPLETED,
              externalPaymentId: razorpay_payment_id,
              externalOrderId: razorpay_order_id,
            },
          })
        : await tx.transaction.create({
            data: {
              type: TransactionType.BRAND_PAYMENT,
              status: TransactionStatus.COMPLETED,
              amount: collab.package.price,
              fromWalletId: brandWallet.id,
              toWalletId: platformWallet.id,
              collabId,
              externalPaymentId: razorpay_payment_id,
              externalOrderId: razorpay_order_id,
              provider: "RAZORPAY",
            },
          })

      console.log("[VERIFY] Transaction created/updated:", paymentTransaction.id)

      // Lock funds in platform escrow
      await tx.wallet.update({
        where: { id: platformWallet.id },
        data: {
          pendingBalance: { increment: collab.package.price },
        },
      })

      console.log("[VERIFY] Platform escrow updated")

      // Track brand spending
      await tx.wallet.update({
        where: { id: brandWallet.id },
        data: {
          totalSpent: { increment: collab.package.price },
        },
      })

      console.log("[VERIFY] Brand spending updated")

      // Update payment status: UNPAID → BRAND_PAID → PLATFORM_HOLD
      await tx.collaboration.update({
        where: { id: collabId },
        data: {
          PaymentStatus: PaymentStatus.PLATFORM_HOLD,
        },
      })

      console.log("[VERIFY] Collaboration PaymentStatus set to PLATFORM_HOLD")

      // Create or update PackageCollaboration with payment tracking
      await tx.packageCollaboration.upsert({
        where: { collabId },
        create: {
          collabId,
          packageId: collab.packageId,
          contentStatus: "NOT_SUBMITTED",
          PaymentStatus: PaymentStatus.PLATFORM_HOLD,
        },
        update: {
          PaymentStatus: PaymentStatus.PLATFORM_HOLD,
        },
      })

      console.log("[VERIFY] PackageCollaboration PaymentStatus set to PLATFORM_HOLD")
    })

    console.log(`[VERIFY] Payment verified successfully for collab ${collabId}, payment_id: ${razorpay_payment_id}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error("[VERIFY] Payment verification error:", errorMsg, err)
    return NextResponse.json(
      { 
        error: `Payment verification failed: ${errorMsg}`,
        details: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
