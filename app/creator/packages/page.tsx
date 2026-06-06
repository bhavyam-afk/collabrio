"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"

type PackageStatusType = "ACTIVE" | "DRAFT"

type CreatorPackage = {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  mediaType: string
  deliverables: string[]
  deliveryTimeDays: number
  price: string
  packageStatus: PackageStatusType
  createdAt?: string
}

type PackagesResponse = {
  packages: CreatorPackage[]
  activeCount: number
  maxActivePackages: number
}

const statusStyles: Record<PackageStatusType, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/20",
  DRAFT: "bg-slate-700/80 text-slate-200 ring-slate-500/20",
}

const helperIcons = {
  ACTIVE: "Active",
  DRAFT: "Draft",
}

type AvailabilityStatusType = "AVAILABLE" | "UNAVAILABLE" | "TENTATIVE"

type AvailabilityEntry = {
  date: string
  status: AvailabilityStatusType
  reason: string | null
}

const availabilityStyle: Record<AvailabilityStatusType, string> = {
  AVAILABLE: "bg-emerald-500/15 text-emerald-100 ring-emerald-500/20",
  UNAVAILABLE: "bg-rose-500/15 text-rose-100 ring-rose-500/20",
  TENTATIVE: "bg-amber-400/15 text-amber-100 ring-amber-400/20",
}

const availabilityDotColor: Record<AvailabilityStatusType, string> = {
  AVAILABLE: "bg-emerald-500",
  UNAVAILABLE: "bg-rose-500",
  TENTATIVE: "bg-amber-400",
}

function AvailabilityCalendar() {
  const [calendarDate, setCalendarDate] = useState(() => {
    const date = new Date()
    date.setDate(1)
    return date
  })
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, AvailabilityStatusType>>({})
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [pendingDay, setPendingDay] = useState<string | null>(null)

  const monthLabel = calendarDate.toLocaleString(undefined, { month: "long", year: "numeric" })

  const isoDate = (date: Date) => date.toISOString().slice(0, 10)

  const loadAvailability = async () => {
    setCalendarError(null)
    setCalendarLoading(true)

    try {
      const start = isoDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1))
      const end = isoDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0))
      const response = await fetch(`/api/creator/availability?start=${start}&end=${end}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load availability")
      }

      const map: Record<string, AvailabilityStatusType> = {}
      ;(data.availability ?? []).forEach((item: AvailabilityEntry) => {
        map[item.date] = item.status
      })
      setAvailabilityMap(map)
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : "Unable to load availability")
    } finally {
      setCalendarLoading(false)
    }
  }

  useEffect(() => {
    loadAvailability()
  }, [calendarDate])

  const days = useMemo(() => {
    const startOfMonth = new Date(calendarDate)
    const weekday = startOfMonth.getDay()
    const start = new Date(startOfMonth)
    start.setDate(startOfMonth.getDate() - weekday)
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    })
  }, [calendarDate])

  const getNextStatus = (current: AvailabilityStatusType | undefined): AvailabilityStatusType => {
    if (current === "UNAVAILABLE") return "TENTATIVE"
    if (current === "TENTATIVE") return "AVAILABLE"
    return "UNAVAILABLE"
  }

  const handleDayClick = async (day: Date) => {
    const dateKey = isoDate(day)
    const currentStatus = availabilityMap[dateKey]
    const nextStatus = getNextStatus(currentStatus)
    setPendingDay(dateKey)
    setCalendarError(null)

    try {
      const response = await fetch("/api/creator/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, status: nextStatus, reason: "Updated from creator calendar" }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update availability")
      }
      setAvailabilityMap((prev) => ({ ...prev, [data.availability.date]: data.availability.status }))
    } catch (err) {
      setCalendarError(err instanceof Error ? err.message : "Unable to update availability")
    } finally {
      setPendingDay(null)
    }
  }

  const isCurrentMonth = (day: Date) => day.getMonth() === calendarDate.getMonth()

  return (
    <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-4 shadow-lg shadow-black/15">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-400/80">Creator availability</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Calendar</h2>
          <p className="mt-2 text-sm text-slate-400">Click any day to toggle the availability state for your creator profile.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200">
          <button
            type="button"
            onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="rounded-full bg-slate-800 px-3 py-2 transition hover:bg-slate-700"
          >
            ◀
          </button>
          <span>{monthLabel}</span>
          <button
            type="button"
            onClick={() => setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            className="rounded-full bg-slate-800 px-3 py-2 transition hover:bg-slate-700"
          >
            ▶
          </button>
        </div>
      </div>

      {calendarError ? (
        <div className="mb-4 rounded-3xl border border-rose-400/10 bg-rose-500/10 p-4 text-sm text-rose-200">
          {calendarError}
        </div>
      ) : null}

      {calendarLoading ? (
        <div className="mb-4 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
          Loading availability...
        </div>
      ) : null}

      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.28em] text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
          <div key={weekday} className="py-2">
            {weekday}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2 text-sm">
        {days.map((day) => {
          const key = isoDate(day)
          const status = availabilityMap[key] ?? "AVAILABLE"
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDayClick(day)}
              disabled={pendingDay === key}
              className={`min-h-14 rounded-3xl border border-white/10 p-2 text-left transition ${isCurrentMonth(day) ? 'bg-slate-950' : 'bg-slate-900/80 opacity-50'} ${availabilityStyle[status]} ${pendingDay === key ? 'cursor-wait opacity-80' : 'hover:-translate-y-0.5 hover:brightness-110'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{day.getDate()}</span>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${availabilityDotColor[status]}`} aria-hidden />
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        {(['AVAILABLE', 'UNAVAILABLE', 'TENTATIVE'] as AvailabilityStatusType[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`inline-block h-3 w-6 rounded-full ${availabilityDotColor[status]}`} aria-hidden />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Page() {
  const [packages, setPackages] = useState<CreatorPackage[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [maxActivePackages, setMaxActivePackages] = useState(3)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    mediaType: "Instagram Reel",
    price: "",
    deliveryTimeDays: "3",
    deliverables: "1 Reel",
    thumbnailUrl: "",
    description: "",
    packageStatus: "DRAFT",
  })

  const canActivateMore = activeCount < maxActivePackages

  const activePackageMessage = useMemo(() => {
    if (activeCount === 0) return "You have no active packages yet."
    if (activeCount < maxActivePackages) return `${activeCount} active package${activeCount === 1 ? "" : "s"}`
    return `Maximum active packages reached (${maxActivePackages}). Deactivate an active package before switching another one on.`
  }, [activeCount, maxActivePackages])

  useEffect(() => {
    fetchPackages()
  }, [])

  async function fetchPackages() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/creator/packages")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load packages")
      }

      setPackages(data.packages)
      setActiveCount(data.activeCount)
      setMaxActivePackages(data.maxActivePackages ?? 3)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch packages.")
    } finally {
      setLoading(false)
    }
  }

  async function submitPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const title = form.title.trim()
    const mediaType = form.mediaType.trim()
    const price = form.price.trim()
    const deliveryTimeDays = form.deliveryTimeDays.trim()
    const deliverables = form.deliverables.trim()

    if (!title || !mediaType || !price || !deliveryTimeDays || !deliverables) {
      setError("Please complete the package title, media type, price, delivery estimates, and deliverables.")
      return
    }

    const priceValue = Number(price)
    const deliveryDaysValue = Number(deliveryTimeDays)

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setError("Price must be a positive number.")
      return
    }

    if (!Number.isInteger(deliveryDaysValue) || deliveryDaysValue <= 0) {
      setError("Delivery time must be a whole number of days.")
      return
    }

    if (form.packageStatus === "ACTIVE" && !canActivateMore) {
      setError(`You can only have ${maxActivePackages} active packages at once.`)
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/creator/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mediaType,
          description: form.description.trim(),
          thumbnailUrl: form.thumbnailUrl.trim(),
          price: priceValue,
          deliveryTimeDays: deliveryDaysValue,
          deliverables,
          packageStatus: form.packageStatus,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to create package.")
      }

      setPackages((current) => [data.package, ...current])
      setActiveCount((count) => count + (data.package.packageStatus === "ACTIVE" ? 1 : 0))
      setSuccess("Package created successfully.")
      setForm({
        title: "",
        mediaType: "Instagram Reel",
        price: "",
        deliveryTimeDays: "3",
        deliverables: "1 Reel",
        thumbnailUrl: "",
        description: "",
        packageStatus: "DRAFT",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create package.")
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(packageId: string, status: "ACTIVE" | "DRAFT" | "DELETED") {
    setError(null)
    setSuccess(null)
    setUpdatingId(packageId)

    if (status === "ACTIVE" && !canActivateMore) {
      setError(`You can only have ${maxActivePackages} active packages at once.`)
      setUpdatingId(null)
      return
    }

    if (status === "DELETED" && !window.confirm("Delete this package? This cannot be undone.")) {
      setUpdatingId(null)
      return
    }

    try {
      const response = await fetch("/api/creator/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, status }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to update package status.")
      }

      setPackages((current) =>
        current
          .map((pkg) => (pkg.id === packageId ? data.package : pkg))
          .filter((pkg) => pkg.packageStatus !== "DELETED")
      )

      const activePackages = currentActiveCountByPackage(packages, packageId, status)
      setActiveCount(activePackages)
      setSuccess(`Package updated to ${status.toLowerCase()}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update package status.")
    } finally {
      setUpdatingId(null)
    }
  }

  function currentActiveCountByPackage(currentPackages: CreatorPackage[], changedPackageId: string, newStatus: string) {
    return currentPackages.reduce((count, pkg) => {
      if (pkg.id === changedPackageId) {
        return count + (newStatus === "ACTIVE" ? 1 : 0)
      }
      return count + (pkg.packageStatus === "ACTIVE" ? 1 : 0)
    }, 0)
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-5 text-slate-100 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 shadow-2xl shadow-black/25 backdrop-blur-xl text-center">
          <h1 className="text-3xl font-bold text-white">Manage Your Packages</h1>
        </div>
        <div className="grid gap-8 xl:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Your packages</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Active packages are visible to brands. Drafts remain private until you activate them.
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
                  {packages.length} package{packages.length === 1 ? "" : "s"}
                </div>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                  Loading packages...
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-rose-400/10 bg-rose-500/10 p-6 text-sm text-rose-200">
                  {error}
                </div>
              ) : packages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700/80 bg-slate-950/60 p-12 text-center text-slate-400">
                  You don’t have any packages yet. Create one using the form on the right.
                </div>
              ) : (
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <article key={pkg.id} className="overflow-hidden rounded-4xl border border-white/10 bg-slate-950/90 p-6 shadow-lg shadow-black/10">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${statusStyles[pkg.packageStatus]}`}>
                              {pkg.packageStatus}
                            </p>
                            <span className="text-xs uppercase tracking-[0.28em] text-slate-500">{pkg.mediaType}</span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold text-white">{pkg.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-slate-400">{pkg.description || "No package description yet."}</p>
                        </div>
                        <div className="space-y-3 text-right">
                          <p className="text-sm font-medium text-slate-300">{pkg.deliveryTimeDays} day{pkg.deliveryTimeDays === 1 ? "" : "s"}</p>
                          <p className="text-2xl font-semibold text-white">₹{Number(pkg.price).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Deliverables</p>
                          <ul className="space-y-2 text-sm text-slate-300">
                            {pkg.deliverables.map((item, index) => (
                              <li key={index} className="rounded-2xl bg-slate-900/70 px-3 py-2">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {(() => {
                          const isActive = pkg.packageStatus === "ACTIVE"
                          const setActiveEnabled = !isActive && canActivateMore && updatingId !== pkg.id
                          const setDraftEnabled = isActive && updatingId !== pkg.id

                          const setActiveClass = setActiveEnabled
                            ? "inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                            : "inline-flex items-center justify-center rounded-3xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 cursor-not-allowed"

                          const setDraftClass = setDraftEnabled
                            ? "inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                            : "inline-flex items-center justify-center rounded-3xl bg-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 cursor-not-allowed"

                          return (
                            <div className="flex flex-col gap-3">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(pkg.id, "ACTIVE")}
                                disabled={!setActiveEnabled}
                                className={setActiveClass}
                              >
                                Set active
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(pkg.id, "DRAFT")}
                                disabled={!setDraftEnabled}
                                className={setDraftClass}
                              >
                                Set draft
                              </button>

                              <button
                                type="button"
                                disabled={updatingId === pkg.id}
                                onClick={() => handleStatusChange(pkg.id, "DELETED")}
                                className="inline-flex items-center justify-center rounded-3xl border border-rose-500 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Delete package
                              </button>
                            </div>
                          )
                        })()}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-4xl border border-white/10 bg-slate-900/80 p-6 shadow-lg shadow-black/15">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">Create new package</h2>
              <p className="mt-2 text-sm text-slate-400">
                Add a structured package for brands to review. Active packages are limited to {maxActivePackages}.
              </p>
            </div>

            <form className="space-y-5" onSubmit={submitPackage}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Package title</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                  placeholder="Short title for brands"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-200">
                  Media type
                  <input
                    value={form.mediaType}
                    onChange={(event) => setForm((prev) => ({ ...prev, mediaType: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                    placeholder="Instagram Reel"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  Price (₹)
                  <input
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                    placeholder="4999"
                    inputMode="decimal"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-200">
                  Delivery time (days)
                  <input
                    value={form.deliveryTimeDays}
                    onChange={(event) => setForm((prev) => ({ ...prev, deliveryTimeDays: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                    placeholder="3"
                    inputMode="numeric"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-200">
                  Package status
                  <select
                    value={form.packageStatus}
                    onChange={(event) => setForm((prev) => ({ ...prev, packageStatus: event.target.value }))}
                    className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE" disabled={!canActivateMore}>
                      Active {canActivateMore ? "" : "(limit reached)"}
                    </option>
                  </select>
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Deliverables</label>
                <textarea
                  value={form.deliverables}
                  onChange={(event) => setForm((prev) => ({ ...prev, deliverables: event.target.value }))}
                  className="min-h-30 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                  placeholder="1 Reel, 2 Stories"
                />
                <p className="mt-2 text-xs text-slate-500">Separate deliverables with commas or line breaks.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-30 w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                  placeholder="Describe the scope and value of the package."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Thumbnail URL</label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(event) => setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
                  className="w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none ring-1 ring-transparent transition focus:border-cyan-400 focus:ring-cyan-500/20"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-3 pt-2">
                {error ? <p className="text-sm text-rose-300">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving package..." : "Create package"}
                </button>
              </div>
            </form>
          </section>
          <AvailabilityCalendar />
        </div>
      </div>
    </main>
  )
}
