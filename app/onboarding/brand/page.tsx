"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function BrandOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<"account" | "profile">("account")

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [bio, setBio] = useState("")
  const [industryTags, setIndustryTags] = useState("")
  const [website, setWebsite] = useState("")
  const [instagram, setInstagram] = useState("")
  const [twitter, setTwitter] = useState("")
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
      formData.append("industryTags", industryTags)
      formData.append("website", website)
      formData.append("instagram", instagram)
      formData.append("twitter", twitter)
      if (file) formData.append("logo", file)

      const res = await fetch("/api/onboarding/brand", {
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

      router.push("/brand/profile")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white py-12 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Step {step === "account" ? "1" : "2"} of 2
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {step === "account" ? "Create your account" : "Build your brand profile"}
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            {step === "account"
              ? "Pick a username and set a password"
              : "Tell creators about your brand and upload a logo"}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl">
          {step === "account" ? (
            <form onSubmit={handleAccountNext} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username (e.g. collabrio_brand)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Brand story</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Share what your brand stands for and the creators you want to work with..."
                  className="w-full rounded-2xl bg-slate-800 text-white border border-slate-700 px-4 py-3 outline-none focus:border-cyan-400"
                />
              </label>

              <label className="block space-y-2 text-sm text-slate-300">
                <span>Industry tags</span>
                <input
                  value={industryTags}
                  onChange={(e) => setIndustryTags(e.target.value)}
                  placeholder="fashion, beauty, lifestyle"
                  className="w-full rounded-2xl bg-slate-800 text-white border border-slate-700 px-4 py-3 outline-none focus:border-cyan-400"
                />
                <p className="text-xs text-slate-500">Separate tags with commas.</p>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="Website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  placeholder="Instagram URL"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <input
                type="text"
                placeholder="Twitter URL (optional)"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
              />

              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Brand logo (optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setFile(file)
                    if (file) setPreview(URL.createObjectURL(file))
                  }}
                  className="text-sm text-slate-300 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-slate-950"
                />
              </div>

              {preview && (
                <img
                  src={preview}
                  alt="Logo preview"
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
