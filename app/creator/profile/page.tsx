"use client"

import { useEffect, useState } from "react"

const fallbackImage =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

type CreatorProfileResponse = {
  id: string
  user: {
    username: string
  }
  bio: string | null
  location: string | null
  niche: string | null
  profilePicUrl: string | null
  introClipUrl: string | null
  category: string | null
  nicheTags: string[]
  portfolio: Array<{ title: string; url: string }> | null
  mlScore: number | null
  followerCount: number
  collaborations: Array<{
    id: string
    brand: string
    campaign: string
    updatedAt: string
    logoUrl: string | null
    initials: string
    status: string
  }>
}

export default function Page() {
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfileResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/creator/profile")
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || "Unable to fetch creator profile")
        }
        const data = (await response.json()) as CreatorProfileResponse
        setCreatorProfile(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load profile")
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
            <h1 className="text-3xl font-semibold text-white">Loading creator profile…</h1>
          </div>
        </div>
      </main>
    )
  }

  if (error || !creatorProfile) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:px-8">
          <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-10 text-slate-200 shadow-2xl shadow-black/40">
            <h1 className="text-3xl font-semibold text-white">Creator profile not found</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {error || "We could not find a creator profile in the database yet."}
            </p>
          </div>
        </div>
      </main>
    )
  }

  const creator = {
    name: creatorProfile.user.username,
    title: `${creatorProfile.category ?? "Creator"} · ${creatorProfile.niche ?? "Creator Economy"}`,
    bio:
      creatorProfile.bio ||
      "Creator focused on premium brand partnerships, storytelling-led campaigns, and measurable audience impact.",
    location: creatorProfile.location || "Unknown",
    niche: creatorProfile.niche || "Creator Economy",
    mlScore: creatorProfile.mlScore ?? 0,
    collabCount: creatorProfile.collaborations.length,
    followerCount: creatorProfile.followerCount,
    profilePic: creatorProfile.profilePicUrl || fallbackImage,
    aiRating: Math.min(
      5,
      Math.max(
        0,
        parseFloat(((((creatorProfile.mlScore ?? 50) / 100) * 5).toFixed(1)))
      )
    ),
  }

  const collabs = creatorProfile.collaborations.map((item) => ({
    id: item.id,
    brand: item.brand,
    campaign: item.campaign,
    date: formatDate(item.updatedAt),
    logoUrl: item.logoUrl,
    initials: item.initials,
    status: item.status,
  }))

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-x-0 top-0 h-60 bg-linear-to-r from-cyan-500/20 via-sky-500/10 to-violet-500/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-slate-800 shadow-lg shadow-cyan-500/10">
                <img
                  src={creator.profilePic}
                  alt={creator.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-400/80">
                  Creator profile
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {creator.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  {creator.bio}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Collaborations
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {creator.collabCount}
                </p>
                <p className="mt-2 text-sm text-slate-400">Past campaigns</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Followers
                </p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {creator.followerCount.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-400">Engaged audience</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-black/20">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">About the creator</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                    Professional creator profile built for pitch decks, brand reviews, and campaign planning.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 px-4 py-2 text-sm text-slate-300 ring-1 ring-white/10">
                  Top niche: {creator.niche}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Location</p>
                  <p className="text-lg font-semibold text-white">{creator.location}</p>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">ML score</p>
                  <p className="text-lg font-semibold text-white">{creator.mlScore}%</p>
                  <p className="text-sm text-slate-400">Brand-match prediction</p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Profile summary</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {creator.name} has a strong track record of working with premium and growth-oriented brands. Their campaigns focus on polished storytelling, measurable engagement, and consistent audience expansion.
                </p>
              </div>
            </section>

            <aside className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Brand fit</p>
                <div className="mt-6 space-y-4">
                  {[
                    "Luxury commerce",
                    "Social storytelling",
                    "Performance-first launches",
                    "Creator-led product reviews",
                  ].map((item) => (
                    <div key={item} className="rounded-3xl bg-slate-900/70 px-4 py-4 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-sm shadow-black/20">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Creator highlights</p>
                <ul className="mt-5 space-y-4 text-sm text-slate-300">
                  <li>• 92% completion rate across last 10 deliverables</li>
                  <li>• 4.8/5 average brand satisfaction score</li>
                  <li>• 15% average lift in campaign engagement</li>
                </ul>
              </div>
            </aside>
          </div>

          <section className="mt-10 rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-black/15">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Recent brand collaborations</h2>
                <p className="mt-2 text-sm text-slate-400">
                  A curated list of recent partnerships and brand campaigns.
                </p>
              </div>
              <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
                {collabs.length} recent collabs
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {collabs.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-cyan-400/20 hover:bg-slate-900/90 transition">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-cyan-500/10 text-lg font-semibold text-cyan-300 ring-1 ring-cyan-500/20">
                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt={item.brand} className="h-full w-full object-cover" />
                      ) : (
                        item.initials
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{item.brand}</p>
                      <p className="text-sm text-slate-400">{item.campaign}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>{item.date}</span>
                    <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
