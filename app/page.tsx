"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Features from "@/components/landing/Features"
import Footer from "@/components/landing/Footer"
import Hero from "@/components/landing/Hero"
import Navbar from "@/components/landing/Navbar"
import LoginCard from "@/components/Auth/LoginCard"

type ModalState = "closed" | "login" | "role-pick"

export default function Home() {
  const router = useRouter()
  const [modal, setModal] = useState<ModalState>("closed")

  function openLogin() {
    setModal("login")
  }

  function openSignup() {
    setModal("role-pick")
  }

  function closeModal() {
    setModal("closed")
  }

  function handleRolePick(role: "creator" | "brand") {
    closeModal()
    router.push(`/onboarding/${role}`)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar onLoginClick={openLogin} onSignupClick={openSignup} />

      <Hero />
      <Features />
      <Footer />

      {modal !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
            {modal === "login" && (
              <LoginCard onClose={closeModal} onSwitchToSignup={openSignup} />
            )}
            {modal === "role-pick" && (
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-semibold text-white mb-2">Join Collabrio</h2>
                <p className="text-slate-400 text-sm mb-8">Who are you joining as?</p>
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => handleRolePick("creator")}
                    className="w-full text-left px-6 py-5 rounded-2xl border border-slate-700 hover:border-cyan-400 transition"
                  >
                    <p className="font-semibold text-white text-lg">I'm a Creator</p>
                    <p className="text-slate-400 text-sm mt-1">
                      List packages and get discovered by brands
                    </p>
                  </button>
                  <button
                    type="button"
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
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={openLogin}
                    className="text-cyan-400 hover:underline"
                  >
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

