// LoginCard.tsx
"use client"

import React, { useState } from "react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import DebouncedInput from "@/components/ui/DebouncedInput"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"

interface LoginCardProps {
  onClose: () => void
  onSwitchToSignup: () => void
}

const LoginCard = ({ onClose, onSwitchToSignup }: LoginCardProps) => {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (!res || res.error) {
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
    if (onboarding === "PENDING") {
      router.push(`/onboarding/${role.toLowerCase()}`)
      return
    }

    router.push(role === "BRAND" ? "/brand/profile" : "/creator/profile")
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
          <p className="text-slate-400 text-sm">Sign in to continue</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
          aria-label="Close login modal"
        >
          ×
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <DebouncedInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          debounce={150}
          required
          className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
        />
        <DebouncedInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          debounce={150}
          required
          className="px-4 py-3 rounded-2xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-cyan-400"
        />

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <LiquidButton
          type="submit"
          className="mt-2 py-4 rounded-2xl text-white font-semibold transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </LiquidButton>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-cyan-400 hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  )
}

export default LoginCard