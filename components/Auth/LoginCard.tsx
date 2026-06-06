// LoginCard.tsx
"use client"

import React, { useState } from "react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"

interface LoginCardProps {
  userType: "brand" | "creator"
}

const LoginCard = ({ userType }: LoginCardProps) => {
  const router = useRouter()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
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
      setError("Unable to load session. Please try again.")
      setLoading(false)
      return
    }

    const { role, onboarding } = session.user

    if (
      (userType === "brand"   && role !== "BRAND") ||
      (userType === "creator" && role !== "CREATOR")
    ) {
      setError(
        `This is the ${userType === "brand" ? "Brand" : "Creator"} portal. ` +
        `Your account is a ${role.toLowerCase()} account.`
      )
      setLoading(false)
      return
    }

    // onboarding not finished
    // if (onboarding === "PENDING") {
    //   router.push(`/onboarding/${role.toLowerCase()}`)
    //   return
    // }

    console.log("SESSION:", session);
    console.log("ROLE:", session.user.role);

    // all good
    router.push(`/${role.toLowerCase()}/profile`)
  }

  return (
    <div className="bg-[#222] rounded-2xl shadow-2xl p-10 w-100 max-w-full text-white flex flex-col gap-6">
      <h2 className="text-3xl font-bold mb-2 text-center">
        Login as {userType === "brand" ? "Brand" : "Creator"}
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="px-4 py-3 rounded bg-gray-800 text-white focus:outline-none"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <LiquidButton type="submit" className="mt-4 w-full invert" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </LiquidButton>

        {error && (
          <p className="text-red-400 text-sm text-center mt-2">{error}</p>
        )}
      </form>

      <p className="text-sm text-gray-400 text-center">Forgot your password?</p>
    </div>
  )
}

export default LoginCard