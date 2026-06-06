"use client"

import { useEffect, useMemo, useState } from "react"
import BrandContentModal from "@/components/brand/BrandContentModal"

type BrandDashboardCollab = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  package: {
    id: string
    title: string
    mediaType: string
    deliveryTimeDays: number
    price: string
  }
  creator: {
    username: string
    email: string
    niche: string | null
    profilePicUrl: string | null
  }
}

type BrandDashboardCounts = {
  pendingRequests: number
  activeCollaborations: number
  cancelledCollaborations: number
  completedCollaborations: number
}

type BrandDashboardResponse = {
  pendingRequests: BrandDashboardCollab[]
  activeCollaborations: BrandDashboardCollab[]
  cancelledCollaborations: BrandDashboardCollab[]
  completedCollaborations: BrandDashboardCollab[]
  counts: BrandDashboardCounts
}

export default function BrandDashboardPage() {
  const [pendingRequests, setPendingRequests] = useState<BrandDashboardCollab[]>([])
  const [activeCollaborations, setActiveCollaborations] = useState<BrandDashboardCollab[]>([])
  const [cancelledCollaborations, setCancelledCollaborations] = useState<BrandDashboardCollab[]>([])
  const [completedCollaborations, setCompletedCollaborations] = useState<BrandDashboardCollab[]>([])
  const [counts, setCounts] = useState<BrandDashboardCounts>({ pendingRequests: 0, activeCollaborations: 0, cancelledCollaborations: 0, completedCollaborations: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [openCollabId, setOpenCollabId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statCards = useMemo(
    () => [
      { label: "Sent requests", value: counts.pendingRequests, description: "Collaboration invites waiting for creator approval." },
      { label: "Active collaborations", value: counts.activeCollaborations, description: "Creator-approved collaborations currently in progress." },
      { label: "Cancelled collaborations", value: counts.cancelledCollaborations, description: "Requests withdrawn or collaborations cancelled." },
      { label: "Completed collaborations", value: counts.completedCollaborations, description: "Collaborations successfully delivered and closed." },
    ],
    [counts]
  )

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/brand/dashboard")
      const data = (await response.json()) as BrandDashboardResponse

      if (!response.ok) {
        throw new Error((data as any)?.error || "Unable to load dashboard data")
      }

      setPendingRequests(data.pendingRequests)
      setActiveCollaborations(data.activeCollaborations)
      setCancelledCollaborations(data.cancelledCollaborations)
      setCompletedCollaborations(data.completedCollaborations)
      setCounts(data.counts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  async function handleCollabAction(collabId: string, action: "withdraw" | "cancel") {
    setError(null)
    setSuccess(null)
    setActionLoading(collabId)

    try {
      const response = await fetch("/api/brand/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collabId, action }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update collaboration")
      }
      setSuccess(action === "withdraw" ? "Request withdrawn." : "Collaboration cancelled.")
      fetchDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update collaboration")
    } finally {
      setActionLoading(null)
    }
  }

  function openBrandContentModal(collabId: string) {
    setOpenCollabId(collabId)
    setIsModalOpen(true)
  }

  function closeBrandContentModal() {
    setOpenCollabId(null)
    setIsModalOpen(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-400/80">Brand dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Manage collaborations</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                See sent requests, withdraw or cancel collaborations, and track accepted creator responses in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/10">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{card.label}</p>
              <p className="mt-4 text-4xl font-semibold text-white">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-8 rounded-4xl border border-rose-400/10 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-8 rounded-4xl border border-emerald-400/10 bg-emerald-500/10 p-6 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Sent requests</h2>
                <p className="mt-2 text-sm text-slate-400">Requests sent to creators that are waiting for approval.</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                {counts.pendingRequests} pending
              </span>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                Loading sent requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                No pending requests right now.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <article key={request.id} className="rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">To {request.creator.username}</p>
                        <h3 className="mt-3 text-xl font-semibold text-white">{request.package.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{request.package.mediaType} • ₹{Number(request.package.price).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={actionLoading === request.id}
                          onClick={() => handleCollabAction(request.id, "withdraw")}
                          className="inline-flex items-center justify-center rounded-3xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === request.id ? "Withdrawing..." : "Withdraw request"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Requested {new Date(request.createdAt).toLocaleDateString()}</span>
                      <span className="rounded-full border border-slate-700/80 px-3 py-1">{request.creator.email}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Accepted collaborations</h2>
              <p className="mt-2 text-sm text-slate-400">These creator-approved collabs are currently in progress.</p>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                Loading active collaborations...
              </div>
            ) : activeCollaborations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                No active collaborations yet.
              </div>
            ) : (
              <div className="space-y-6">
                {activeCollaborations.map((collab) => (
                  <article key={collab.id} onClick={() => openBrandContentModal(collab.id)} className="cursor-pointer rounded-4xl border border-white/10 bg-slate-950/90 p-6 shadow-sm shadow-black/10 transition hover:scale-[1.01] hover:border-cyan-400/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm uppercase tracking-[0.28em] text-emerald-400">Active</p>
                        <h3 className="mt-3 text-2xl md:text-3xl font-semibold text-white">{collab.package.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{collab.package.mediaType} • ₹{Number(collab.package.price).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <button
                          type="button"
                          disabled={actionLoading === collab.id}
                          onClick={(e) => { e.stopPropagation(); handleCollabAction(collab.id, "cancel") }}
                          className="inline-flex items-center justify-center rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === collab.id ? "Cancelling..." : "Cancel"}
                        </button>
                        <p className="text-xs text-slate-500">Started {new Date(collab.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                      <span>Creator: <span className="font-semibold text-white">{collab.creator.username}</span></span>
                      <span className="rounded-full border border-slate-700/80 px-3 py-1">{collab.creator.niche || "Creator"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Cancelled collaborations</h2>
            <p className="mt-2 text-sm text-slate-400">Requests withdrawn or collaborations that were closed by your team.</p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
              Loading cancelled collaborations...
            </div>
          ) : cancelledCollaborations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
              No cancelled collaborations yet.
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledCollaborations.map((collab) => (
                <article key={collab.id} className="rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Cancelled</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{collab.package.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{collab.package.mediaType} • ₹{Number(collab.package.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Updated {new Date(collab.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-8 rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Completed collaborations</h2>
            <p className="mt-2 text-sm text-slate-400">Collaborations that have been successfully completed and approved.</p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
              Loading completed collaborations...
            </div>
          ) : completedCollaborations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
              No completed collaborations yet.
            </div>
          ) : (
            <div className="space-y-4">
              {completedCollaborations.map((collab) => (
                <article key={collab.id} className="rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm uppercase tracking-[0.28em] text-emerald-400">Completed</p>
                      <h3 className="mt-3 text-xl font-semibold text-white">{collab.package.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{collab.package.mediaType} • ₹{Number(collab.package.price).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Completed {new Date(collab.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Creator: <span className="font-semibold text-white">{collab.creator.username}</span></span>
                    <span className="rounded-full border border-slate-700/80 px-3 py-1">{collab.creator.email}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>      </div>
      <BrandContentModal collabId={openCollabId} isOpen={isModalOpen} onClose={closeBrandContentModal} onActionComplete={fetchDashboard} />
    </main>
  )
}


