import Razorpay from "razorpay"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/clients/prisma"
import { authOptions } from "../../../auth/authOptions"
import { TransactionType, TransactionStatus, CollabStatus } from "@prisma/client"

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

async function validateBrandSession() {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    const userRole = (session?.user as any)?.role as string | undefined

    if (!userId) {
        return { status: 401, body: { error: "Unauthorized" } }
    }

    if (userRole !== "BRAND") {
        return { status: 403, body: { error: "Access denied" } }
    }

    const brandProfile = await prisma.brandProfile.findUnique({ where: { userId } })
    if (!brandProfile) {
        return { status: 404, body: { error: "Brand profile not found" } }
    }

    return { status: 200, brandProfile }
}

export async function POST(req: Request) {
    try {
        const validation = await validateBrandSession()
        if (validation.status !== 200) {
            return NextResponse.json(validation.body, { status: validation.status })
        }

        const { collabId } = await req.json()
        if (!collabId) {
            return NextResponse.json({ error: "collabId is required" }, { status: 400 })
        }

        const collab = await prisma.collaboration.findUnique({
            where: { id: collabId },
            include: {
                package: true,
            },
        })

        if (!collab) {
            return NextResponse.json({ error: "Collaboration not found" }, { status: 404 })
        }

        if (collab.brandId !== validation.brandProfile?.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }

        if (collab.collabStatus !== CollabStatus.ACTIVE) {
            console.error(`[CREATE] Collaboration ${collabId} status is ${collab.collabStatus}, expected ACTIVE`)
            return NextResponse.json(
                { error: `Payment can only be initiated for active collaborations. Current status: ${collab.collabStatus}` },
                { status: 400 }
            )
        }

        if (!collab.package) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 })
        }

        const existingOrderTx = await prisma.transaction.findFirst({
            where: {
                collabId,
                type: TransactionType.BRAND_PAYMENT,
                status: TransactionStatus.PENDING,
            },
            orderBy: { createdAt: "desc" },
        })

        const validRazorpayOrder =
            existingOrderTx?.externalOrderId &&
            existingOrderTx.externalOrderId.startsWith("order_")

        if (validRazorpayOrder) {
            console.log(
                `[CREATE] Reusing Razorpay order ${existingOrderTx.externalOrderId}`
            )

            return NextResponse.json({
                orderId: existingOrderTx.externalOrderId,
                amount: Math.round(Number(collab.package.price) * 100),
                currency: "INR",
            })
        }

        if (existingOrderTx) {
            console.warn(
                `[CREATE] Ignoring invalid order id: ${existingOrderTx.externalOrderId}`
            )
        }

        const amount = Math.round(Number(collab.package.price) * 100)

        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `collab_${collabId}`,
            notes: {
                collabId,
                brandId: collab.brandId,
                packageId: collab.packageId,
            },
        })

        console.log({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        })

        await prisma.transaction.create({
            data: {
                collabId,
                type: TransactionType.BRAND_PAYMENT,
                status: TransactionStatus.PENDING,
                amount: collab.package.price,
                externalOrderId: order.id,
                provider: "RAZORPAY",
            },
        })

        console.log(`[CREATE] Order created for collab ${collabId}, order_id: ${order.id}, amount: ${order.amount}`)
        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        })
    } catch (error) {
        console.error("[CREATE] Failed to create Razorpay order:", error instanceof Error ? error.message : error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to create order" },
            { status: 500 }
        )
    }
}
