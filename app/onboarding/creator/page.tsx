"use client"

import { useState } from "react"
import DebouncedInput from "@/components/ui/DebouncedInput"
import DebouncedTextarea from "@/components/ui/DebouncedTextarea"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const CATEGORIES = ["NANO", "MICRO", "MACRO", "CELEB"] as const

export default function CreatorOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<"account" | "profile">("account")

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [bio, setBio] = useState("")
  const [niche, setNiche] = useState("")
  const [location, setLocation] = useState("")
  const [nicheTags, setNicheTags] = useState("")
  const [followerCount, setFollowerCount] = useState("")
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("NANO")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function handleAccountNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!username.trim() || !email.trim() || !password) {
      setError("All fields are required")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username: letters, numbers and underscores only")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setStep("profile")
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("username", username.trim())
      formData.append("email", email.trim().toLowerCase())
      formData.append("password", password)
      formData.append("bio", bio)
      formData.append("niche", niche)
      formData.append("location", location)
      formData.append("category", category)
      formData.append("followerCount", followerCount)
      formData.append("nicheTags", nicheTags)
      if (file) formData.append("profilePic", file)

      const res = await fetch("/api/onboarding/creator", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Setup failed")
        if (res.status === 409) setStep("account")
        setLoading(false)
        return
      }

      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        setError("Account created but sign-in failed. Please log in from the home page.")
        setLoading(false)
        return
      }

      router.push("/creator/profile")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 text-white py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Step {step === "account" ? "1" : "2"} of 2
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {step === "account" ? "Create your account" : "Complete your profile"}
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            {step === "account"
              ? "Pick a username and set a password"
              : "Help brands discover you"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
          {step === "account" ? (
            <form onSubmit={handleAccountNext} className="flex flex-col gap-4">
              <DebouncedInput
                type="text"
                placeholder="Username (e.g. bhavyam_creates)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                debounce={150}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <DebouncedInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                debounce={150}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <DebouncedInput
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                debounce={150}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              {error && <p className="text-rose-400 text-sm">{error}</p>}
              <button
                type="submit"
                className="mt-2 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
              >
                Continue →
              </button>
              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <a href="/" className="text-cyan-400 hover:underline">Log in</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Niche (Food, Fitness...)"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
                <input
                  placeholder="City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Follower count"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <DebouncedTextarea
                placeholder="Tell brands what makes your content special..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                debounce={150}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <input
                placeholder="Tags: food, travel, lifestyle (comma separated)"
                value={nicheTags}
                onChange={(e) => setNicheTags(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Profile picture (optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setFile(f)
                    if (f) setPreview(URL.createObjectURL(f))
                  }}
                  className="text-sm text-slate-300 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-slate-950 file:mr-3"
                />
              </div>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-36 w-full object-cover rounded-2xl"
                />
              )}
              {error && <p className="text-rose-400 text-sm">{error}</p>}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setStep("account"); setError("") }}
                  className="flex-1 py-4 rounded-2xl border border-slate-700 text-slate-300 hover:border-slate-500 transition"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Complete setup"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
