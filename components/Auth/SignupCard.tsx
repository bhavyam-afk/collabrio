// SignupCard.tsx
"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { useRouter } from "next/navigation"

interface SignupCardProps {
  userType: "brand" | "creator"
}

const SignupCard = ({ userType }: SignupCardProps) => {
  const router = useRouter()

  const [username, setUsername]               = useState("")
  const [email, setEmail]                     = useState("")
  const [password, setPassword]               = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [bio, setBio]                         = useState("")
  const [location, setLocation]               = useState("")
  const [niche, setNiche]                     = useState("")
  const [instagram, setInstagram]             = useState("")
  const [file, setFile]                       = useState<File | null>(null)
  const [error, setError]                     = useState("")
  const [loading, setLoading]                 = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      // Use multipart form so we can include an optional profile picture file
      const formData = new FormData()
      formData.append("username", username.trim())
      formData.append("email", email.trim().toLowerCase())
      formData.append("password", password)
      formData.append("type", userType.toUpperCase())
      if (bio) formData.append("bio", bio)
      if (location) formData.append("location", location)
      if (niche) formData.append("niche", niche)
      if (instagram) formData.append("instagram", instagram)
      if (file) formData.append("profilePic", file)

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Signup failed")
        return
      }

      // auto sign-in after register
      const signRes = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      })

      if (signRes?.error) {
        setError("Account created but sign-in failed. Please log in manually.")
        return
      }

      router.push(`/onboarding/${userType}`)

    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#222] rounded-2xl shadow-2xl p-10 w-100 max-w-full text-white flex flex-col gap-6">
      <h2 className="text-3xl font-bold mb-2 text-center">
        Sign up as {userType === "brand" ? "Brand" : "Creator"}
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username (letters, numbers, underscores)"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Display name / full name"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Location (city, country)"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Primary niche (e.g., food, travel)"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={niche}
          onChange={e => setNiche(e.target.value)}
        />
        <input
          type="text"
          placeholder="Instagram handle (optional)"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={instagram}
          onChange={e => setInstagram(e.target.value)}
        />
        <label className="block space-y-1 text-sm text-slate-300">
          <span className="text-sm text-gray-300">Profile picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-300 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-slate-950"
          />
        </label>
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm password"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />

        <LiquidButton type="submit" className="mt-4 w-full invert" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </LiquidButton>

        {error && (
          <p className="text-red-400 text-sm text-center mt-2">{error}</p>
        )}
      </form>
    </div>
  )
}

export default SignupCard