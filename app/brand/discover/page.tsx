"use client"

import { useEffect, useState } from "react"

type BrandDiscoverPackage = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  mediaType: string
  deliverables: string[]
  deliveryTimeDays: number
  price: string
  creator: {
    username: string
    niche: string | null
    profilePicUrl: string | null
  }
}

export default function DiscoverPage() {
  const [packages, setPackages] = useState<BrandDiscoverPackage[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filteredPackages = packages.filter((pkg) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return [pkg.title, pkg.description ?? "", pkg.mediaType, pkg.creator.username, pkg.creator.niche ?? ""].some((value) =>
      value.toLowerCase().includes(query)
    )
  })

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/brand/discover")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load packages")
      }
      setPackages(data.packages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load packages")
    } finally {
      setLoading(false)
    }
  }

  async function sendRequest(packageId: string) {
    setRequesting(packageId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/brand/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to send request")
      }
      setSuccess("Request sent successfully.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request")
    } finally {
      setRequesting(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/25">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-white">Discover creator packages</h1>
              <p className="mt-3 text-sm text-slate-400">
                Browse active creator packages and send collaboration requests.
              </p>
            </div>
            <div className="max-w-sm">
              <label htmlFor="discover-search" className="sr-only">
                Search packages
              </label>
              <input
                id="discover-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search creators, formats, or campaign types"
                className="w-full rounded-3xl border border-white/15 bg-slate-900/95 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-4xl border border-rose-400/10 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-4xl border border-emerald-400/10 bg-emerald-500/10 p-6 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-4xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
            Loading packages...
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
            No active packages are available right now.
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
            No packages match your search terms.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredPackages.map((pkg) => (
              <article key={pkg.id} className="rounded-4xl border border-white/10 bg-slate-900/90 p-6 shadow-lg shadow-black/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">{pkg.mediaType}</p>
                    <h2 className="mt-3 text-xl font-semibold text-white">{pkg.title}</h2>
                    <p className="mt-2 text-sm text-slate-400">{pkg.description || "No description provided."}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-white">₹{Number(pkg.price).toLocaleString()}</p>
                    <p className="text-sm text-slate-500">{pkg.deliveryTimeDays} days</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="rounded-2xl bg-slate-800 px-3 py-1">{pkg.creator.username}</span>
                  {pkg.creator.niche ? <span className="rounded-2xl bg-slate-800 px-3 py-1">{pkg.creator.niche}</span> : null}
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  {pkg.deliverables.map((item, index) => (
                    <div key={index} className="rounded-3xl bg-slate-950/70 px-3 py-2">
                      {item}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={requesting === pkg.id}
                  onClick={() => sendRequest(pkg.id)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {requesting === pkg.id ? "Sending request..." : "Send request"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
