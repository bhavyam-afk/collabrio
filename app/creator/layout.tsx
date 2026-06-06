"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import React from "react"

const tabs = [
  { label: "Profile", href: "/creator/profile" },
  { label: "Packages", href: "/creator/packages" },
  { label: "Dashboard", href: "/creator/dashboard" },
]

const CreatorLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sessionToken")
      localStorage.removeItem("authToken")
      sessionStorage.removeItem("sessionToken")
      document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "next-auth.csrf-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    }

    await signOut({ callbackUrl: "/api/auth/signin" })
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-semibold tracking-tight text-cyan-300">collabrio</div>

          <nav className="hidden grow items-center justify-center gap-2 md:flex">
            {tabs.map((tab) => {
              const active = pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-cyan-500/30 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500/15"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}

export default CreatorLayout
