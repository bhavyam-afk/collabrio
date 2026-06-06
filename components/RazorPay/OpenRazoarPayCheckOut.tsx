"use client"

import { loadRazorpay } from "@/components/RazorPay/LoadRazorPay"

export async function openRazorpayCheckout({
  orderId,
  amount,
  currency,
  collabId,
}: {
  orderId?: string;
  amount: number;
  currency: string;
  collabId: string;
}) {
  // Check environment variable
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    const msg = "Razorpay Key ID not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env.local file."
    console.error("[Razorpay]", msg)
    throw new Error(msg)
  }

  // Load SDK
  try {
    console.log("[Razorpay] Loading SDK...")
    await loadRazorpay()
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load Razorpay SDK"
    console.error("[Razorpay] SDK load error:", msg)
    throw err
  }

  // Create order
  console.log("[Razorpay] Creating order for collab:", collabId)
  const orderResponse = await fetch("/api/razorpay/payment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collabId }),
  })

  if (!orderResponse.ok) {
    const errorData = await orderResponse.json().catch(() => ({ error: "Unknown error" }))
    const msg = `Order creation failed: ${errorData?.error || "Unknown error"}`
    console.error("[Razorpay]", msg)
    throw new Error(msg)
  }

  const orderData = await orderResponse.json()
  console.log("[Razorpay] Order created:", {
    orderId: orderData.orderId,
    amount: orderData.amount,
    currency: orderData.currency,
  })

  return new Promise<void>((resolve, reject) => {
    try {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Collabrio",
        description: "Creator Collaboration Payment",
        order_id: orderData.orderId,
        prefill: {
          name: "Creator",
          email: "creator@collabrio.local",
          contact: "9999999999",
        },
        notes: {
          collabId: collabId,
        },

        handler: async function (response: any) {
          try {
            console.log("[Razorpay] Payment success, verifying:", {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
            })

            const verifyRes = await fetch("/api/razorpay/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                collabId,
              }),
            })

            console.log("[Razorpay] Verify response status:", verifyRes.status)

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json().catch(() => ({ 
                error: `HTTP ${verifyRes.status}`,
                message: verifyRes.statusText,
              }))
              console.error("[Razorpay] Verification failed:", {
                status: verifyRes.status,
                response: errorData,
              })
              return reject(new Error(errorData?.error || `Payment verification failed (${verifyRes.status})`))
            }

            const successData = await verifyRes.json()
            console.log("[Razorpay] Payment verified successfully:", successData)
            alert("Payment successful 🎉")
            resolve()
          } catch (err) {
            console.error("[Razorpay] Verification error:", err)
            reject(err instanceof Error ? err : new Error("Payment verification failed"))
          }
        },

        modal: {
          ondismiss: function () {
            console.warn("[Razorpay] Checkout dismissed by user")
            reject(new Error("Payment checkout was closed"))
          },
          confirm_close: true,
        },

        theme: {
          color: "#7b52d3",
          backdrop: true,
        },
      };

      console.log(
        "[Razorpay] Opening checkout with key:",
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 5) + "..."
      )
      console.log("[Razorpay] Checkout options:", {
        key: options.key?.substring(0, 5) + "...",
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id,
        prefill: options.prefill?.name,
      })
      
      const rzp = new (window as any).Razorpay(options)
      console.log("[Razorpay] Razorpay instance created, opening modal...")
      rzp.open()
    } catch (err) {
      console.error("[Razorpay] Error creating checkout:", err)
      reject(err instanceof Error ? err : new Error("Failed to create Razorpay checkout"))
    }
  })
}
