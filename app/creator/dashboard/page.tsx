"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import ContentSubmissionModal from "@/components/creator/ContentSubmissionModal"

type CollaborationItem = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  package: {
    id: string
    title: string
    thumbnailUrl: string | null
    mediaType: string
    price: string
  }
  brand: {
    username: string
    email: string
  }
}

type DashboardCounts = {
  pendingRequests: number
  acceptedCollaborations: number
  cancelledCollaborations: number
  completedCollaborations: number
}

type DashboardResponse = {
  pendingRequests: CollaborationItem[]
  acceptedCollaborations: CollaborationItem[]
  cancelledCollaborations: CollaborationItem[]
  completedCollaborations: CollaborationItem[]
  counts: DashboardCounts
}

type UploadedFile = {
  url: string
  previewUrl?: string
  type: string
}

type ContentModalState = {
  collabId: string | null
  collab: CollaborationItem | null
  contentStatus: string | null
  uploadedFiles: UploadedFile[]
  isOpen: boolean
}

export default function Page() {
  const [pendingRequests, setPendingRequests] = useState<CollaborationItem[]>([])
  const [acceptedCollaborations, setAcceptedCollaborations] = useState<CollaborationItem[]>([])
  const [cancelledCollaborations, setCancelledCollaborations] = useState<CollaborationItem[]>([])
  const [completedCollaborations, setCompletedCollaborations] = useState<CollaborationItem[]>([])
  const [counts, setCounts] = useState<DashboardCounts>({ pendingRequests: 0, acceptedCollaborations: 0, cancelledCollaborations: 0, completedCollaborations: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Content submission modal state
  const [contentModal, setContentModal] = useState<ContentModalState>({ 
    collabId: null, 
    collab: null, 
    contentStatus: "NOT_SUBMITTED", 
    uploadedFiles: [],
    isOpen: false 
  })
  const [modalLoading, setModalLoading] = useState(false)

  const statCards = useMemo(
    () => [
      { label: "Pending requests", value: counts.pendingRequests, description: "Brand invites waiting for your approval." },
      { label: "Active collabs", value: counts.acceptedCollaborations, description: "Collaborations you have accepted and are working on." },
      { label: "Cancelled collabs", value: counts.cancelledCollaborations, description: "Requests withdrawn or collaborations cancelled by brands." },
      { label: "Completed collabs", value: counts.completedCollaborations, description: "Collaborations successfully completed." },
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
      const response = await fetch("/api/creator/dashboard")
      const data: DashboardResponse = await response.json()

      if (!response.ok) {
        throw new Error((data as any)?.error || "Unable to load dashboard data")
      }

      setPendingRequests(data.pendingRequests)
      setAcceptedCollaborations(data.acceptedCollaborations)
      setCancelledCollaborations(data.cancelledCollaborations)
      setCompletedCollaborations(data.completedCollaborations)
      setCounts(data.counts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }

  async function acceptRequest(collabId: string) {
    setError(null)
    setSuccess(null)
    setActionLoading(collabId)

    try {
      const response = await fetch("/api/creator/dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collabId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to accept request")
      }
      setSuccess("Request accepted successfully.")
      fetchDashboard()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept request")
    } finally {
      setActionLoading(null)
    }
  }

  async function openContentModal(collab: CollaborationItem) {
    setModalLoading(true)
    try {
      const response = await fetch(`/api/creator/content/${collab.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load content status")
      }

      setContentModal({
        collabId: collab.id,
        collab,
        contentStatus: data.contentStatus,
        uploadedFiles: data.uploadedFiles,
        isOpen: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content status")
    } finally {
      setModalLoading(false)
    }
  }

  function closeContentModal() {
    setContentModal({
      collabId: null,
      collab: null,
      contentStatus: "NOT_SUBMITTED",
      uploadedFiles: [],
      isOpen: false,
    })
  }

  function handleUploadSuccess(file: UploadedFile) {
    setContentModal((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, file],
      contentStatus: "SUBMITTED",
    }))
  }

  function handleDeleteSuccess() {
    // Refetch the content status when file is deleted
    if (contentModal.collabId) {
      openContentModal(contentModal.collab!)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-400/80">Creator dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Analytics & collaboration requests</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Review incoming brand requests, accept collabs, and keep accepted collaborations organized from one creator dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
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
                <h2 className="text-2xl font-semibold text-white">Brand requests</h2>
                <p className="mt-2 text-sm text-slate-400">These are collaboration invites that are pending your approval.</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-2 text-xs uppercase tracking-[0.3em] text-slate-300">
                {counts.pendingRequests} pending
              </span>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                Loading requests...
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                No pending brand requests at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <article key={request.id} className="rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">From {request.brand.username}</p>
                        <h3 className="mt-3 text-xl font-semibold text-white">{request.package.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{request.package.mediaType} • ₹{Number(request.package.price).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={actionLoading === request.id}
                          onClick={() => acceptRequest(request.id)}
                          className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading === request.id ? "Accepting..." : "Accept request"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Requested {new Date(request.createdAt).toLocaleDateString()}</span>
                      <span className="rounded-full border border-slate-700/80 px-3 py-1">{request.brand.email}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Accepted collaborations</h2>
              <p className="mt-2 text-sm text-slate-400">Current collabs that have been accepted and are now active.</p>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                Loading active collaborations...
              </div>
            ) : acceptedCollaborations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                No accepted collaborations yet.
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedCollaborations.map((collab) => {
                  const contentStatusColor = contentModal.collab?.id === collab.id ? (
                    contentModal.contentStatus === "NOT_SUBMITTED"
                      ? "text-amber-400"
                      : contentModal.contentStatus === "SUBMITTED"
                        ? "text-blue-400"
                        : contentModal.contentStatus === "APPROVED"
                          ? "text-emerald-400"
                          : "text-slate-400"
                  ) : "text-slate-400"

                  return (
                    <article
                      key={collab.id}
                      onClick={() => openContentModal(collab)}
                      className="cursor-pointer rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10 transition hover:border-cyan-400/50 hover:bg-slate-900/50"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm uppercase tracking-[0.28em] text-emerald-400">Active</p>
                            {contentModal.collab?.id === collab.id && contentModal.contentStatus && (
                              <span className={`text-xs uppercase tracking-widest font-semibold ${contentStatusColor}`}>
                                {contentModal.contentStatus === "NOT_SUBMITTED"
                                  ? "🔴 No submission"
                                  : contentModal.contentStatus === "SUBMITTED"
                                    ? "🔵 Submitted"
                                    : contentModal.contentStatus === "APPROVED"
                                      ? "✓ Approved"
                                      : contentModal.contentStatus}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-white">{collab.package.title}</h3>
                          <p className="mt-2 text-sm text-slate-400">{collab.package.mediaType} • ₹{Number(collab.package.price).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">From {collab.brand.username}</p>
                          <p className="mt-2 text-sm text-slate-500">Started {new Date(collab.updatedAt).toLocaleDateString()}</p>
                          <p className="mt-3 text-xs font-semibold text-cyan-400">Click to submit content →</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Cancelled collaborations</h2>
              <p className="mt-2 text-sm text-slate-400">Brand requests withdrawn or collaborations cancelled on the brand side.</p>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                Loading cancelled collaborations...
              </div>
            ) : cancelledCollaborations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                No cancelled collaborations to show.
              </div>
            ) : (
              <div className="space-y-4">
                {cancelledCollaborations.map((collab) => (
                  <article key={collab.id} className="rounded-4xl border border-white/10 bg-slate-950/90 p-5 shadow-sm shadow-black/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm uppercase tracking-[0.28em] text-rose-400">Cancelled</p>
                        <h3 className="mt-3 text-xl font-semibold text-white">{collab.package.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{collab.package.mediaType} • ₹{Number(collab.package.price).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">From {collab.brand.username}</p>
                        <p className="mt-2 text-sm text-slate-500">Cancelled {new Date(collab.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Completed collaborations</h2>
            <p className="mt-2 text-sm text-slate-400">Collaborations you have completed and the brand has approved.</p>
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
                    <div className="text-right">
                      <p className="text-sm text-slate-400">From {collab.brand.username}</p>
                      <p className="mt-2 text-sm text-slate-500">Completed {new Date(collab.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Content Submission Modal */}
      <ContentSubmissionModal
        collab={contentModal.collab}
        contentStatus={contentModal.contentStatus as any}
        uploadedFiles={contentModal.uploadedFiles}
        isOpen={contentModal.isOpen}
        onClose={closeContentModal}
        onUploadSuccess={handleUploadSuccess}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </main>
  )
}
