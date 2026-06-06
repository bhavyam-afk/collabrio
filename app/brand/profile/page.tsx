"use client"

import { useEffect, useState } from "react"

const fallbackImage = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

type BrandProfileResponse = {
  id: string
  user: {
    username: string
  }
  bio: string | null
  industryTags: string[]
  logoUrl: string | null
  plan: string
  collaborations: Array<{
    id: string
    creator: string
    creatorNiche: string | null
    creatorProfilePicUrl: string | null
    campaign: string
    price: string | null
    deliveryTimeDays: number | null
    updatedAt: string
    initials: string
    status: string
  }>
}

export default function BrandProfilePage() {
  const [brandProfile, setBrandProfile] = useState<BrandProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/brand/profile")
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || "Unable to fetch brand profile")
        }

        const data = (await response.json()) as BrandProfileResponse
        setBrandProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load brand profile")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
          <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-10 text-slate-200 shadow-2xl shadow-black/40">
            <h1 className="text-3xl font-semibold text-white">Loading your brand profile…</h1>
          </div>
        </div>
      </main>
    )
  }

  if (error || !brandProfile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
          <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-10 text-slate-200 shadow-2xl shadow-black/40">
            <h1 className="text-3xl font-semibold text-white">Brand profile not found</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {error || "We could not find a brand profile in the database yet."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const brandName = brandProfile.user.username
  const industry = brandProfile.industryTags[0] ?? "Brand Growth"
  const collabCount = brandProfile.collaborations.length
  const completedCount = brandProfile.collaborations.filter((item) => item.status === "COMPLETED").length
  const activeCount = brandProfile.collaborations.filter((item) => item.status === "ACTIVE").length
  const logo = brandProfile.logoUrl || fallbackImage

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-x-0 top-0 h-60 bg-linear-to-r from-cyan-500/20 via-sky-500/10 to-violet-500/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-slate-800 shadow-lg shadow-cyan-500/10">
                <img src={logo} alt={brandName} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">Brand profile</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {brandName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  {brandProfile.bio || "Partner with top creators, manage campaigns, and keep past collaborations visible in one place."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Collaborations</p>
                <p className="mt-4 text-3xl font-semibold text-white">{collabCount}</p>
                <p className="mt-2 text-sm text-slate-400">Recent partner campaigns</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Subscription</p>
                <p className="mt-4 text-3xl font-semibold text-white">{brandProfile.plan}</p>
                <p className="mt-2 text-sm text-slate-400">Current BrandOrbit plan</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Brand details</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Your brand profile shows campaign history, collaboration status, and your partner brand narrative.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
                  Top industry: {industry}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Plan</p>
                  <p className="text-lg font-semibold text-white">{brandProfile.plan}</p>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Recent active</p>
                  <p className="text-lg font-semibold text-white">{activeCount}</p>
                  <p className="text-sm text-slate-400">Live collaborations</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Mission</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {brandProfile.bio || "Build meaningful creator relationships and turn campaigns into measurable growth."}
                </p>
              </div>
            </section>

            <aside className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Industry tags</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {brandProfile.industryTags.length > 0 ? (
                    brandProfile.industryTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs text-slate-300"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                      No tags yet
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Past campaign outcomes</p>
                <ul className="mt-5 space-y-4 text-sm text-slate-300">
                  <li>• {completedCount} completed collaborations</li>
                  <li>• {collabCount} total brand partnerships</li>
                  <li>• Fast response for creator requests</li>
                </ul>
              </div>
            </aside>
          </div>

          <section className="mt-10 rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-black/15">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Recent creator collaborations</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Review the most recent brand campaigns and creator partnerships.
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                {collabCount} recent collabs
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {brandProfile.collaborations.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center text-slate-400">
                  No recent collaborations yet.
                </div>
              ) : (
                brandProfile.collaborations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/20 hover:bg-slate-900/90"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-cyan-500/10 text-lg font-semibold text-cyan-300 ring-1 ring-cyan-500/20">
                        {item.creatorProfilePicUrl ? (
                          <img src={item.creatorProfilePicUrl} alt={item.creator} className="h-full w-full object-cover" />
                        ) : (
                          item.initials
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-white">{item.creator}</p>
                        <p className="text-sm text-slate-400">{item.creatorNiche || "Creator partnership"}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <p className="font-medium text-white">{item.campaign}</p>
                      <p className="mt-2">Delivered in {item.deliveryTimeDays ?? "n/a"} days • {item.price ? `₹${Number(item.price).toLocaleString()}` : "No price"}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                      <span>{formatDate(item.updatedAt)}</span>
                      <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
