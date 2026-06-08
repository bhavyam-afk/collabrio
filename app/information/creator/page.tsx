import { FiUser, FiImage, FiLink2, FiArrowRight } from "react-icons/fi"
import Mermaid from "@/components/ui/Mermaid"

export default function CreatorInformationPage() {
  const signupFlow = `
    flowchart LR
      A[Visitor] --> B(Signup / Onboarding)
      B --> C{Brand or Creator}
      C -->|Brand| D["POST /api/onboarding/brand<br/>(onboarding: COMPLETE)<br/>S3 logo upload"]
      C -->|Creator| E["POST /api/onboarding/creator<br/>(onboarding: COMPLETE)<br/>S3 profilePic"]
      D --> F[Sign in → Brand Dashboard]
      E --> G[Sign in → Creator Dashboard]
  `

  const collabFlow = `
    flowchart TD
      B[Brand dashboard] -->|Discover packages| C[Find Creator Package]
      C --> D["Send collaboration request<br/>(Collaboration: PENDING)"]
      D --> E[Creator accepts → ACTIVE]
      E --> F[Brand creates Razorpay order]
      F --> G[Payment verified → PLATFORM_HOLD]
      G --> H["Creator uploads draft (S3)<br/>SUBMITTED"]
      H --> I[Brand reviews → Approve]
      I --> J["Release escrow<br/>CREATOR_PAID → Collaboration COMPLETED"]
      H --> K["Or request improvements<br/>IMPROVEMENT_REQUESTED"]
  `

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-600/20 via-transparent to-purple-600/20 blur-3xl" />
          <div className="relative">
            <h1 className="text-5xl font-black mb-3 text-white">Creator Guide</h1>
            <p className="text-lg text-slate-300 max-w-3xl">
              Complete your profile, connect Instagram, and start earning from collaborations. Everything you need to succeed on Collabrio.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/10 group-hover:to-cyan-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiUser className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Complete Your Profile</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Fill in bio, niche, follower count and category to improve discoverability and attract brand collaborations.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-purple-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiImage className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Upload Profile Picture</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Professional photo upload (S3 storage). Accepts JPEG/PNG/WebP, max 10MB for fast loading.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-orange-600/0 to-orange-600/0 group-hover:from-orange-600/10 group-hover:to-orange-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-orange-500 to-red-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiLink2 className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Connect Instagram</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Link your Professional account with Meta for analytics access. Optional but recommended for discovery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagrams Section */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl space-y-12">
          {/* Signup Flow */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-linear-to-r from-cyan-500 to-blue-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Signup & Onboarding</h2>
            </div>
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <Mermaid chart={signupFlow} theme="dark" />
              </div>
            </div>
          </div>

          {/* Collaboration Flow */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-linear-to-r from-purple-500 to-pink-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Collaboration & Upload</h2>
            </div>
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <Mermaid chart={collabFlow} theme="dark" />
              </div>
            </div>
          </div>

          {/* Files & Limits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-linear-to-r from-orange-500 to-red-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Files & Limits</h2>
            </div>
            <div className="rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <p className="text-slate-300 leading-relaxed">
                Profile pictures and draft uploads accept <span className="text-cyan-400 font-semibold">JPEG/PNG/WebP</span> formats and are validated server-side. File size is restricted to <span className="text-cyan-400 font-semibold">10MB</span> for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

