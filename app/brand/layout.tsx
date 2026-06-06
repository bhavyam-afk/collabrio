"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"

const tabs = [
  { label: "Profile", href: "/brand/profile" },
  { label: "Discover", href: "/brand/discover" },
  { label: "Dashboard", href: "/brand/dashboard" },
]

const BrandLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

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

          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

export default BrandLayout
