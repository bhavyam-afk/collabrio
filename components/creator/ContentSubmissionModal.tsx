"use client"

import { useState, useRef, useEffect } from "react"

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

type ContentStatus = "NOT_SUBMITTED" | "SUBMITTED" | "IMPROVEMENT_REQUESTED" | "APPROVED" | "REJECTED"

type UploadedFile = {
  url: string
  previewUrl?: string
  type: string
}

type ContentSubmissionModalProps = {
  collab: CollaborationItem | null
  contentStatus: ContentStatus | null
  uploadedFiles: UploadedFile[]
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (file: UploadedFile) => void
  onDeleteSuccess?: () => void
}

export default function ContentSubmissionModal({
  collab,
  contentStatus,
  uploadedFiles,
  isOpen,
  onClose,
  onUploadSuccess,
  onDeleteSuccess,
}: ContentSubmissionModalProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [localFiles, setLocalFiles] = useState<UploadedFile[]>(uploadedFiles)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update localFiles when uploadedFiles prop changes
  useEffect(() => {
    setLocalFiles(uploadedFiles)
  }, [uploadedFiles])

  if (!isOpen || !collab) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    await uploadFile(file)
    e.currentTarget.value = "" // Reset input
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("collabId", collab.id)

      const response = await fetch("/api/uploads/creatordraft", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Upload failed")
      }

      setSuccess(`${file.name} uploaded successfully!`)
      onUploadSuccess({ url: data.fileUrl, previewUrl: data.previewUrl, type: data.contentType })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (fileIndex: number) => {
    try {
      setDeleting(fileIndex)
      setError(null)

      const response = await fetch("/api/uploads/creatordraft", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collabId: collab.id, fileIndex }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Delete failed")
      }

      // Remove from local state
      const newFiles = localFiles.filter((_, i) => i !== fileIndex)
      setLocalFiles(newFiles)
      setSuccess("File removed successfully!")
      
      // If all files were deleted, refetch the status from the server
      if (newFiles.length === 0 && onDeleteSuccess) {
        onDeleteSuccess()
      }
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file")
    } finally {
      setDeleting(null)
    }
  }

  const getStatusColor = (status: ContentStatus | null) => {
    switch (status) {
      case "SUBMITTED":
        return "text-blue-400"
      case "APPROVED":
        return "text-emerald-400"
      case "IMPROVEMENT_REQUESTED":
        return "text-amber-400"
      case "REJECTED":
        return "text-rose-400"
      default:
        return "text-slate-400"
    }
  }

  const getStatusBgColor = (status: ContentStatus | null) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/10 border-blue-400/20"
      case "APPROVED":
        return "bg-emerald-500/10 border-emerald-400/20"
      case "IMPROVEMENT_REQUESTED":
        return "bg-amber-500/10 border-amber-400/20"
      case "REJECTED":
        return "bg-rose-500/10 border-rose-400/20"
      default:
        return "bg-slate-800/50 border-slate-700/50"
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform">
        <div className="rounded-4xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-400">
                Content Submission
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {collab.package.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Collaboration Details */}
          <div className="mb-6 space-y-2 rounded-3xl bg-slate-800/50 p-4 text-sm text-slate-300">
            <p>
              <span className="text-slate-400">From:</span> {collab.brand.username}
            </p>
            <p>
              <span className="text-slate-400">Package:</span>{" "}
              {collab.package.mediaType}
            </p>
            <p>
              <span className="text-slate-400">Price:</span> ₹
              {Number(collab.package.price).toLocaleString()}
            </p>
          </div>

          {/* Content Status */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
              Content Status
            </h3>
            <div
              className={`rounded-2xl border p-4 ${getStatusBgColor(
                contentStatus as ContentStatus
              )}`}
            >
              <p className={`font-semibold ${getStatusColor(contentStatus as ContentStatus)}`}>
                {contentStatus === "NOT_SUBMITTED" ? "🔴 Not Submitted" : contentStatus}
              </p>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {localFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Uploaded Files ({localFiles.length})
              </h3>
              <div className="space-y-2">
                {localFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-slate-800/50 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">
                        {file.type === "video" ? "🎥" : "🖼️"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {file.type === "video" ? "Video" : "Image"} - {idx + 1}
                        </p>
                        <a
                          href={file.previewUrl ?? file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:underline truncate"
                        >
                          View file →
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFile(idx)}
                      disabled={deleting === idx || uploading || contentStatus === "APPROVED"}
                      className="rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs text-rose-300 transition"
                      title={contentStatus === "APPROVED" ? "Cannot remove approved content" : "Remove this file"}
                    >
                      {deleting === idx ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Section */}
          {contentStatus === "NOT_SUBMITTED" || contentStatus === "IMPROVEMENT_REQUESTED" ? (
            <>
              <div className="mb-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {contentStatus === "IMPROVEMENT_REQUESTED"
                    ? "Submit Revised Content"
                    : "Upload Your Content"}
                </h3>

                {/* File Upload Area */}
                <div
                  className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-600/50 bg-slate-800/30 p-8 text-center transition hover:border-cyan-400/50 hover:bg-slate-800/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-4xl mb-2">📁</p>
                  <p className="font-semibold text-white">Click to upload</p>
                  <p className="mt-1 text-sm text-slate-400">
                    or drag and drop
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    MP4, MOV, JPEG, PNG, WebP • Max 500MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                  ✕ {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  ✓ {success}
                </div>
              )}
            </>
          ) : contentStatus === "APPROVED" ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              ✓ Your content has been approved by the brand!
            </div>
          ) : contentStatus === "REJECTED" ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              ✕ Your content was not approved. Please upload new content to resubmit.
            </div>
          ) : null}

          {/* Footer */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="rounded-3xl border border-white/10 px-6 py-2.5 font-semibold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
            {contentStatus === "NOT_SUBMITTED" && localFiles.length > 0 && (
              <button
                disabled={uploading || deleting !== null}
                className="rounded-3xl bg-cyan-500 px-6 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
