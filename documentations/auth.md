# Collabrio — Auth Flow v2
# Matches your actual project structure

---

## Your Actual Structure (from screenshot)

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts     ← EXISTS — NextAuth handler
│   │   └── authOptions.ts             ← EXISTS — NextAuth config
│   ├── onboarding/
│   │   ├── creator/route.ts           ← EXISTS — creator profile update
│   │   └── brand/route.ts             ← EXISTS — brand profile update
│   ├── brand/                         ← EXISTS — brand API routes
│   ├── creator/                       ← EXISTS — creator API routes
│   ├── razorpay/                      ← EXISTS — payment routes
│   └── uploads/                       ← EXISTS — S3 upload routes
├── onboarding/
│   └── brand/                         ← EXISTS (creator missing — create it)
├── brand/                             ← EXISTS — brand pages
├── creator/                           ← EXISTS — creator pages
├── layout.tsx                         ← EXISTS
└── page.tsx                           ← EXISTS — landing page

components/
└── Auth/
    ├── LoginCard.tsx                  ← EXISTS
    ├── NavButtons.tsx                 ← EXISTS
    └── SignupCard.tsx                 ← EXISTS
```

---

## What Needs to Change / Be Created

```
CREATE:  app/onboarding/creator/page.tsx    ← missing
UPDATE:  app/page.tsx                       ← wire login modal + role picker
UPDATE:  components/Auth/LoginCard.tsx      ← handle post-login redirect
UPDATE:  components/Auth/SignupCard.tsx     ← remove, replace with role picker
UPDATE:  components/Auth/NavButtons.tsx    ← open modal on click
UPDATE:  app/api/onboarding/creator/route.ts ← fold register logic in
UPDATE:  app/api/onboarding/brand/route.ts   ← fold register logic in
UPDATE:  middleware.ts                       ← fix routes (no [username])
DELETE:  app/api/auth/register/route.ts     ← unnecessary, fold into onboarding
```

---

## The Flow (your structure, clean version)

```
app/page.tsx
│
├── NavButtons.tsx — "Log in" button
│     → opens LoginCard modal (state lives in page.tsx)
│     → LoginCard: email + password → signIn() → redirect to dashboard
│
└── NavButtons.tsx — "Get started" button
      → opens role picker modal (state lives in page.tsx)
      → user picks Creator or Brand
      → router.push("/onboarding/creator") or router.push("/onboarding/brand")
            ↓
      Onboarding page — two steps in one page:
        Step 1: username + email + password
        Step 2: bio + niche + photo etc.
        On submit:
          POST /api/onboarding/[role]  ← creates everything + signs in
          router.push("/creator/dashboard") or router.push("/brand/dashboard")
```

---

## File 1 — `app/page.tsx`

Landing page owns the modal state. Passes open handlers to NavButtons.
LoginCard and role picker render inside the modal here.

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import NavButtons from "@/components/Auth/NavButtons"
import LoginCard from "@/components/Auth/LoginCard"

// your existing landing page sections go here unchanged
// just add the modal state + NavButtons + modal rendering

type Modal = "closed" | "login" | "role-pick"

export default function LandingPage() {
  const router            = useRouter()
  const [modal, setModal] = useState<Modal>("closed")

  function openLogin()  { setModal("login")     }
  function openSignup() { setModal("role-pick") }
  function closeModal() { setModal("closed")    }

  function handleRolePick(role: "creator" | "brand") {
    closeModal()
    router.push(`/onboarding/${role}`)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Your existing hero / landing sections here */}
      {/* Pass open handlers into NavButtons */}
      <NavButtons onLoginClick={openLogin} onSignupClick={openSignup} />

      {/* Modal backdrop */}
      {modal !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Login modal — reuse your existing LoginCard */}
            {modal === "login" && (
              <LoginCard
                onClose={closeModal}
                onSwitchToSignup={openSignup}
              />
            )}

            {/* Role picker modal */}
            {modal === "role-pick" && (
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-semibold text-white mb-2">Join Collabrio</h2>
                <p className="text-slate-400 text-sm mb-8">Who are you joining as?</p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => handleRolePick("creator")}
                    className="w-full text-left px-6 py-5 rounded-2xl border border-slate-700 hover:border-cyan-400 transition"
                  >
                    <p className="font-semibold text-white text-lg">I'm a Creator</p>
                    <p className="text-slate-400 text-sm mt-1">
                      List packages and get discovered by brands
                    </p>
                  </button>
                  <button
                    onClick={() => handleRolePick("brand")}
                    className="w-full text-left px-6 py-5 rounded-2xl border border-slate-700 hover:border-cyan-400 transition"
                  >
                    <p className="font-semibold text-white text-lg">I'm a Brand</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Find creators and run collaborations
                    </p>
                  </button>
                </div>
                <p className="mt-6 text-center text-sm text-slate-400">
                  Already have an account?{" "}
                  <button onClick={openLogin} className="text-cyan-400 hover:underline">
                    Log in
                  </button>
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </main>
  )
}
```

---

## File 3 — `components/Auth/NavButtons.tsx`

Just buttons. No logic. Calls handlers passed from page.tsx.

```tsx
// components/Auth/NavButtons.tsx

type Props = {
  onLoginClick:  () => void
  onSignupClick: () => void
}

export default function NavButtons({ onLoginClick, onSignupClick }: Props) {
  return (
    <div className="flex gap-4">
      <button
        onClick={onLoginClick}
        className="px-8 py-4 rounded-3xl border border-white/20 text-white hover:border-white/50 transition"
      >
        Log in
      </button>
      <button
        onClick={onSignupClick}
        className="px-8 py-4 rounded-3xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
      >
        Get started
      </button>
    </div>
  )
}
```

---

## File 4 — `components/Auth/LoginCard.tsx`

Login form. No routing to separate page. After login, reads session and
pushes to the correct dashboard.

```tsx
// components/Auth/LoginCard.tsx
"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Props = {
  onClose:         () => void
  onSwitchToSignup: () => void
}

export default function LoginCard({ onClose, onSwitchToSignup }: Props) {
  const router              = useRouter()
  const [email, setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]   = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email:    email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (!res?.ok || res.error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    const session = await getSession()
    if (!session?.user) {
      setError("Unable to load session. Try again.")
      setLoading(false)
      return
    }

    const { role, onboarding } = session.user

    // If they never finished onboarding, send them there
    if (onboarding === "PENDING") {
      router.push(`/onboarding/${role.toLowerCase()}`)
      return
    }

    // Route by role — no [username] in URL
    router.push(role === "BRAND" ? "/brand/profile" : "/creator/profile")
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-2xl font-semibold text-white mb-6">Welcome back</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <button onClick={onSwitchToSignup} className="text-cyan-400 hover:underline">
          Sign up
        </button>
      </p>
    </div>
  )
}
```

---

## File 5 — `app/onboarding/creator/page.tsx` (CREATE THIS — it's missing)

Two-step page. Step 1: account credentials. Step 2: profile details.
One API call at the end. No /api/auth/register needed.

```tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

const CATEGORIES = ["NANO", "MICRO", "MACRO", "CELEB"] as const

export default function CreatorOnboardingPage() {
  const router = useRouter()

  // Step tracker
  const [step, setStep] = useState<"account" | "profile">("account")

  // Account fields (step 1)
  const [username, setUsername] = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")

  // Profile fields (step 2)
  const [bio, setBio]                     = useState("")
  const [niche, setNiche]                 = useState("")
  const [location, setLocation]           = useState("")
  const [nicheTags, setNicheTags]         = useState("")
  const [followerCount, setFollowerCount] = useState("")
  const [category, setCategory]           = useState<typeof CATEGORIES[number]>("NANO")
  const [file, setFile]                   = useState<File | null>(null)
  const [preview, setPreview]             = useState<string | null>(null)

  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  // Step 1 — client-side only, no API call
  function handleAccountNext(e: React.FormEvent) {
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

  // Step 2 — one API call does everything
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData()
      // account fields
      formData.append("username",     username.trim())
      formData.append("email",        email.trim().toLowerCase())
      formData.append("password",     password)
      // profile fields
      formData.append("bio",          bio)
      formData.append("niche",        niche)
      formData.append("location",     location)
      formData.append("category",     category)
      formData.append("followerCount", followerCount)
      formData.append("nicheTags",    nicheTags)
      if (file) formData.append("profilePic", file)

      const res = await fetch("/api/onboarding/creator", {
        method: "POST",
        body:   formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Setup failed")
        // If it's a credential error (duplicate email/username), go back to step 1
        if (res.status === 409) setStep("account")
        setLoading(false)
        return
      }

      // Sign in after account is created
      const signInRes = await signIn("credentials", {
        email:    email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (signInRes?.error) {
        setError("Account created but sign-in failed. Please log in from the home page.")
        setLoading(false)
        return
      }

      // onboarding is COMPLETE already (set in the API route)
      
      router.push("/creator/profile")

    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white py-12 px-4">
      <div className="mx-auto max-w-lg">

        {/* Progress indicator */}
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

          {/* ── STEP 1: Account credentials ─────────────────────────── */}
          {step === "account" && (
            <form onSubmit={handleAccountNext} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Username (e.g. bhavyam_creates)"
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
                Already have an account?{" "}
                <a href="/" className="text-cyan-400 hover:underline">Log in</a>
              </p>
            </form>
          )}

          {/* ── STEP 2: Profile details ──────────────────────────────── */}
          {step === "profile" && (
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
              <textarea
                placeholder="Tell brands what makes your content special..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
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
```

Brand onboarding page is the same structure. Replace:
- `"CREATOR"` → `"BRAND"`
- `/api/onboarding/creator` → `/api/onboarding/brand`
- `/creator/profile` → `/brand/profile`
- Profile fields: bio, industryTags (comma separated), website, instagram, twitter(optional), logo file

---

## File 6 — `app/api/onboarding/creator/route.ts`

This route now does EVERYTHING in one transaction:
creates User + Wallet + CreatorProfile + sets onboarding COMPLETE.
No separate register route needed.

```typescript
// app/api/onboarding/creator/route.ts

import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import bcrypt from "bcryptjs"
import { uploadToS3 } from "@/clients/uploadToS3"
import { z } from "zod"

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]

// Validate account fields
const accountSchema = z.object({
  email:    z.string().email("Invalid email"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscores only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    // ── 1. Parse and validate account fields ──────────────────────
    const parsed = accountSchema.safeParse({
      email:    formData.get("email")?.toString().trim().toLowerCase(),
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, username, password } = parsed.data

    // ── 2. Check uniqueness before doing any S3 work ───────────────
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email already registered" : "Username already taken" },
        { status: 409 }
      )
    }

    // ── 3. Parse profile fields ────────────────────────────────────
    const bio          = formData.get("bio")?.toString().trim() || null
    const location     = formData.get("location")?.toString().trim() || null
    const niche        = formData.get("niche")?.toString().trim() || null
    const category     = formData.get("category")?.toString().trim() || "NANO"
    const followerCount = parseInt(formData.get("followerCount")?.toString() || "0", 10)
    const nicheTags    = formData.get("nicheTags")?.toString()
      .split(",").map((t) => t.trim()).filter(Boolean) || []
    const file         = formData.get("profilePic") as File | null

    // ── 4. Upload profile pic to S3 before transaction ─────────────
    // Do this outside the transaction — S3 is not transactional
    let profilePicUrl: string | null = null

    if (file && file.size > 0) {
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, or WebP allowed" },
          { status: 400 }
        )
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image must be under 10MB" },
          { status: 400 }
        )
      }
      const key    = `onboarding/creators/${username}/profile-${Date.now()}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToS3(buffer, key, file.type)
      profilePicUrl = result.url
    }

    // ── 5. Hash password ───────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── 6. Single atomic transaction ───────────────────────────────
    // Creates: User + Wallet + CreatorProfile — all or nothing
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType:   "CREATOR",
          onboarding: "COMPLETE",   // set COMPLETE immediately — no pending state
        },
      })

      await tx.wallet.create({
        data: {
          userId:     user.id,
          walletType: "CREATOR",
        },
      })

      await tx.creatorProfile.create({
        data: {
          userId:       user.id,
          bio,
          location,
          niche,
          category:     category as any,
          nicheTags,
          followerCount: isNaN(followerCount) ? 0 : followerCount,
          profilePicUrl,
        },
      })
    })

    // ── 7. Return success — frontend then calls signIn() ──────────
    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {
    console.error("[ONBOARDING/CREATOR]", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
```

---

## File 7 — `app/api/onboarding/brand/route.ts`

Same structure. Replace creator-specific fields with brand fields.

```typescript
// app/api/onboarding/brand/route.ts

import { NextResponse } from "next/server"
import prisma from "@/clients/prisma"
import bcrypt from "bcryptjs"
import { uploadToS3 } from "@/clients/uploadToS3"
import { z } from "zod"

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]

const accountSchema = z.object({
  email:    z.string().email("Invalid email"),
  username: z.string()
    .min(3).max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username: letters, numbers, underscores only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()

    // ── 1. Validate account fields ─────────────────────────────────
    const parsed = accountSchema.safeParse({
      email:    formData.get("email")?.toString().trim().toLowerCase(),
      username: formData.get("username")?.toString().trim(),
      password: formData.get("password")?.toString(),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, username, password } = parsed.data

    // ── 2. Check uniqueness ────────────────────────────────────────
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.email === email ? "Email already registered" : "Username already taken" },
        { status: 409 }
      )
    }

    // ── 3. Parse brand profile fields ──────────────────────────────
    const bio          = formData.get("bio")?.toString().trim() || null
    const industryTags = formData.get("industryTags")?.toString()
      .split(",").map((t) => t.trim()).filter(Boolean) || []
    const website      = formData.get("website")?.toString().trim() || null
    const instagram    = formData.get("instagram")?.toString().trim() || null
    const twitter      = formData.get("twitter")?.toString().trim() || null
    const file         = formData.get("logo") as File | null

    // ── 4. Upload logo to S3 ───────────────────────────────────────
    let logoUrl: string | null = null

    if (file && file.size > 0) {
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 })
      }
      const key    = `onboarding/brands/${username}/logo-${Date.now()}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await uploadToS3(buffer, key, file.type)
      logoUrl = result.url
    }

    // ── 5. Build social links array ────────────────────────────────
    const socialLinks = []
    if (website)   socialLinks.push({ platform: "website",   url: website })
    if (instagram) socialLinks.push({ platform: "instagram", url: instagram })
    if (twitter)   socialLinks.push({ platform: "twitter",   url: twitter })

    // ── 6. Hash password ───────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── 7. Single atomic transaction ───────────────────────────────
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType:   "BRAND",
          onboarding: "COMPLETE",   // COMPLETE immediately
        },
      })

      await tx.wallet.create({
        data: {
          userId:     user.id,
          walletType: "BRAND",
        },
      })

      await tx.brandProfile.create({
        data: {
          userId:      user.id,
          bio,
          industryTags,
          logoUrl,
          socialLinks: socialLinks.length > 0 ? socialLinks : [],
        },
      })
    })

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {
    console.error("[ONBOARDING/BRAND]", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
```

---

## What Each Backend Call Does (plain language)

```
POST /api/onboarding/creator
  Receives:  FormData — username, email, password, bio, niche, location,
             category, followerCount, nicheTags, profilePic (file)
  Does:
    1. Zod validates username/email/password format
    2. Checks DB — email or username already taken? → 409
    3. Uploads profilePic to S3 (if provided) → gets URL
    4. Hashes password with bcrypt (12 rounds)
    5. $transaction:
         creates User (userType: CREATOR, onboarding: COMPLETE)
         creates Wallet (walletType: CREATOR)
         creates CreatorProfile (all fields + S3 url)
    6. Returns { success: true }
  Frontend then: signIn() → router.push("/creator/dashboard")


POST /api/onboarding/brand
  Receives:  FormData — username, email, password, bio, industryTags,
             website, instagram, twitter, logo (file)
  Does:
    1-4: Same as creator (validate, check uniqueness, upload, hash)
    5. $transaction:
         creates User (userType: BRAND, onboarding: COMPLETE)
         creates Wallet (walletType: BRAND)
         creates BrandProfile (all fields + S3 logo url)
    6. Returns { success: true }
  Frontend then: signIn() → router.push("/brand/dashboard")


POST /api/auth/[...nextauth] (credentials signIn)
  Receives:  email + password
  Does:
    1. prisma.user.findUnique by email
    2. bcrypt.compare password vs hash
    3. Returns user object: { id, email, username, role, onboarding }
    4. JWT callback stores all fields in token
    5. Session callback exposes them via useSession()
  Result:
    session.user = { id, email, username, role: "CREATOR"|"BRAND", onboarding: "COMPLETE" }
```

---

## Checklist Before Testing

```
□ app/onboarding/creator/page.tsx    created (was missing)
□ app/onboarding/brand/page.tsx      updated (same two-step pattern)
□ app/page.tsx                       updated (modal state + NavButtons + LoginCard)
□ components/Auth/LoginCard.tsx      updated (accepts onClose + onSwitchToSignup props)
□ components/Auth/NavButtons.tsx     updated (accepts onClick handlers as props)
□ app/api/onboarding/creator/route.ts updated (creates User + Wallet + Profile)
□ app/api/onboarding/brand/route.ts  updated (creates User + Wallet + Profile)
□ types/next-auth.d.ts               exists with id, username, role, onboarding
□ app/layout.tsx                     has SessionProvider wrapping children
□ .env.local                         has NEXTAUTH_SECRET and DATABASE_URL
```

---

*Collabrio Auth Flow v2 — June 2026*