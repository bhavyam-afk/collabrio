"use client"

// utils/loadRazorpay.ts
export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      console.log("[Razorpay] SDK already loaded")
      return resolve(true)
    }

    console.log("[Razorpay] Loading SDK from CDN...")
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => {
      console.log("[Razorpay] SDK loaded successfully")
      resolve(true)
    }
    script.onerror = (error) => {
      console.error("[Razorpay] Failed to load SDK:", error)
      reject(new Error("Failed to load Razorpay SDK. Please check your internet connection."))
    },
    document.body.appendChild(script)
  })
}
