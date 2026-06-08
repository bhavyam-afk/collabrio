import { FiSend, FiDollarSign, FiUsers, FiCheckCircle } from "react-icons/fi"
import Mermaid from "@/components/ui/Mermaid"

export default function BrandInformationPage() {
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
          <div className="absolute inset-0 bg-linear-to-br from-amber-600/20 via-transparent to-orange-600/20 blur-3xl" />
          <div className="relative">
            <h1 className="text-5xl font-black mb-3 text-white">Brand Guide</h1>
            <p className="text-lg text-slate-300 max-w-3xl">
              Find creators, manage collaborations securely, and grow your brand. Complete control over discovery, payments, and content approval.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:to-blue-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiUsers className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Find Creators</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Browse active creator packages by niche, follower count and category. Send collaboration requests with custom budgets.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-600/0 to-emerald-600/0 group-hover:from-emerald-600/10 group-hover:to-emerald-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-emerald-500 to-green-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiDollarSign className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Secure Payments</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Razorpay integration with escrow protection. Funds held safely until you approve content and collaboration completes.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-purple-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiSend className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Review & Feedback</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Review creator drafts in one place. Approve content or request improvements before final release and payment.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer transform hover:scale-105">
              <div className="absolute inset-0 bg-linear-to-br from-amber-600/0 to-amber-600/0 group-hover:from-amber-600/10 group-hover:to-amber-600/5 transition-all duration-300" />
              <div className="relative z-10">
                <div className="inline-block p-3 bg-linear-to-br from-amber-500 to-yellow-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FiCheckCircle className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Complete Control</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Track collaborations from request to completion. Approve to release escrow and mark creator as paid automatically.
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
              <div className="h-1 w-8 bg-linear-to-r from-blue-500 to-cyan-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Signup & Onboarding</h2>
            </div>
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-linear-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <Mermaid chart={signupFlow} theme="dark" />
              </div>
            </div>
          </div>

          {/* Collaboration Flow */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-linear-to-r from-emerald-500 to-green-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Collaboration & Payment</h2>
            </div>
            <div className="group relative overflow-hidden rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-linear-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <Mermaid chart={collabFlow} theme="dark" />
              </div>
            </div>
          </div>

          {/* Files & Limits */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-linear-to-r from-amber-500 to-orange-500 rounded" />
              <h2 className="text-2xl font-bold text-white">Files & Limits</h2>
            </div>
            <div className="rounded-2xl p-8 bg-linear-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
              <p className="text-slate-300 leading-relaxed">
                Brand logos accept <span className="text-emerald-400 font-semibold">JPEG/PNG/WebP</span> formats and are validated server-side before S3 upload. File size is restricted to <span className="text-emerald-400 font-semibold">10MB</span> to ensure fast dashboard loading.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
