"use client"

import { useEffect, useState } from "react"
import { openRazorpayCheckout } from "@/components/RazorPay/OpenRazoarPayCheckOut"

type UploadedFile = { url: string; previewUrl?: string; type: string }

type Props = {
  collabId: string | null
  isOpen: boolean
  onClose: () => void
  onActionComplete?: () => void
}

export default function BrandContentModal({ collabId, isOpen, onClose, onActionComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [contentStatus, setContentStatus] = useState<string | null>(null)
  const [collabStatus, setCollabStatus] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [pkgPrice, setPkgPrice] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pkgTitle, setPkgTitle] = useState<string | null>(null)

  const paymentCompleted = paymentStatus === "BRAND_PAID" || paymentStatus === "PLATFORM_HOLD" || paymentStatus === "CREATOR_PAID"

  useEffect(() => {
    if (isOpen && collabId) fetchContent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, collabId])

  async function fetchContent() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/brand/content/${collabId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to load")

      setContentStatus(data.contentStatus)
      setCollabStatus(data.collabStatus || null)
      setUploadedFiles(data.uploadedFiles || [])
      setPaymentStatus(data.paymentStatus || data.paymentState || null)
      setPkgTitle(data.package?.title || null)
      setPkgPrice(data.package?.price || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  async function doApprove() {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/brand/content/${collabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to approve")

      setContentStatus(data.contentStatus)
      setSuccess("Approved successfully")
      onActionComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve")
    }
  }

  async function requestImprovement() {
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/brand/content/${collabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_improvement", feedback }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to request improvement")

      setContentStatus(data.contentStatus)
      setSuccess("Improvement requested")
      onActionComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request improvement")
    }
  }

  async function handlePay() {
    if (!collabId || !pkgPrice) {
      setError("Unable to start payment at this time")
      return
    }

    setError(null)
    setSuccess(null)

    try {
      console.log("[Brand Payment] Initiating payment for collab:", collabId)
      await openRazorpayCheckout({
        orderId: "",
        amount: Number(pkgPrice),
        currency: "INR",
        collabId,
      })
      
      console.log("[Brand Payment] Payment completed, fetching updated status...")
      // Fetch updated payment status from server to confirm
      const statusRes = await fetch(`/api/brand/content/${collabId}`)
      if (statusRes.ok) {
          const data = await statusRes.json()
          setPaymentStatus(data.paymentStatus || data.paymentState || "COMPLETED")
        } else {
          setPaymentStatus("COMPLETED")
        }
      setSuccess("Payment completed successfully. Creator can now upload content.")
      onActionComplete?.()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Payment failed"
      console.error("[Brand Payment] Error:", errorMsg, err)
      setError(errorMsg)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-4xl border border-white/10 bg-slate-900/95 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-400">Review submission</p>
              <h3 className="text-xl font-semibold text-white">{pkgTitle}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400">✕</button>
          </div>

          {loading ? (
            <div className="p-6 text-slate-400">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-400">Collab status</p>
                  <p className="font-semibold text-white">{collabStatus || "UNKNOWN"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Payment status</p>
                  <p className="font-semibold text-white">{paymentStatus || "UNPAID"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Content status</p>
                  <p className="font-semibold text-white">{contentStatus}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400">Uploaded files</p>
                <div className="mt-2 space-y-2">
                  {uploadedFiles.length === 0 ? (
                    <p className="text-sm text-slate-400">Creator has not submitted anything yet.</p>
                  ) : (
                    uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-lg">{f.type === "video" ? "🎥" : "🖼️"}</span>
                        <a href={f.previewUrl ?? f.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline truncate">View</a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {!paymentCompleted && (
                <>
                  {error && <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-4 mb-4">
                    <p className="text-sm text-rose-300">{error}</p>
                  </div>}
                  <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-200">Payment is required before content can be uploaded or approved.</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className="text-sm text-slate-200">Amount: ₹{Number(pkgPrice || 0).toLocaleString()}</span>
                      <button onClick={handlePay} className="inline-flex items-center justify-center rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                        Pay now
                      </button>
                    </div>
                    {paymentStatus === "PENDING" && (
                      <p className="mt-2 text-sm text-slate-300">Payment is pending. Complete the Razorpay checkout to continue.</p>
                    )}
                  </div>
                </>
              )}

              {paymentCompleted && (
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-200 font-semibold">Thanks for your payment.</p>
                  <p className="mt-2 text-sm text-slate-200">You will be notified once the creator uploads their drafts.</p>
                </div>
              )}

              {uploadedFiles.length > 0 ? (
                paymentCompleted ? (
                  contentStatus === "APPROVED" ? (
                    <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                      <p className="text-sm text-emerald-300">✓ This submission has been approved.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-slate-400">Request improvement (optional message)</p>
                        <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="w-full mt-2 p-3 rounded-md bg-slate-800 text-slate-100" placeholder="Tell the creator what to improve (e.g., add product close-ups, reduce length, change music)"></textarea>
                      </div>

                      {error && <div className="text-sm text-rose-300">{error}</div>}
                      {success && <div className="text-sm text-emerald-300">{success}</div>}

                      <div className="flex gap-3 justify-end">
                        <button onClick={requestImprovement} className="rounded-3xl border border-white/10 px-4 py-2 text-sm text-white">Request improvement</button>
                        <button onClick={doApprove} className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">Approve</button>
                      </div>
                    </>
                  )
                ) : (
                  <div className="text-sm text-slate-500">Waiting for creator to submit their draft.</div>
                )
              ) : (
                <div className="text-sm text-slate-500">Waiting for creator to submit their draft.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
