"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Sparkles, Users, Zap, Shield, Target, TrendingUp } from "lucide-react";

const BrandPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
    viewport: { once: true },
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    viewport: { once: true },
  };

  return (
    <div className="bg-gradient-to-br from-[#0b0e27] via-[#1a1f3a] to-[#232946] min-h-screen text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0e27]/80 border-b border-purple-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-purple-400">BrandOrbit</div>
          <div className="flex gap-6 items-center">
            <a href="/creator" className="hover:text-purple-300 transition">For Creators</a>
            <Link href="/api/auth/signin" className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div {...fadeInUp}>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
            Connect with Creators Effortlessly
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover, collaborate, and track your influencer marketing campaigns all in one platform. Simplify your creator partnerships with BrandOrbit.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/api/auth/signin">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition text-lg">
                Start Collaborating Now
              </button>
            </Link>
            <button className="border border-purple-500 px-8 py-4 rounded-xl font-semibold hover:bg-purple-500/10 transition text-lg">
              See Demo
            </button>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div {...staggerContainer} className="grid grid-cols-3 gap-6 mt-16">
          {[
            { number: "10K+", label: "Creators" },
            { number: "500+", label: "Active Brands" },
            { number: "$5M+", label: "Collaborations" }
          ].map((stat, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-purple-500/10 backdrop-blur border border-purple-500/20 rounded-xl p-6">
              <div className="text-3xl font-bold text-purple-400">{stat.number}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">How Package Collaborations Work</h2>
          <p className="text-xl text-gray-400">A simple 5-step process to launch your creator campaigns</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            {
              step: 1,
              title: "Create Packages",
              description: "Define collaboration packages with deliverables, pricing, and timeline. Set clear expectations.",
              icon: "📦"
            },
            {
              step: 2,
              title: "Browse Creators",
              description: "Discover creators matching your niche. Filter by category, audience, and engagement rates.",
              icon: "🔍"
            },
            {
              step: 3,
              title: "Send Requests",
              description: "Propose collaborations to your chosen creators. They review and accept or negotiate terms.",
              icon: "📨"
            },
            {
              step: 4,
              title: "Review Content",
              description: "Creators submit drafts. Review, approve, or request improvements before publishing.",
              icon: "✅"
            },
            {
              step: 5,
              title: "Manage Payment",
              description: "Secure payment via Razorpay. Funds held in escrow until content is published.",
              icon: "💳"
            }
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} className="relative">
              <div className="bg-gradient-to-b from-purple-500/20 to-purple-500/5 border border-purple-500/20 rounded-2xl p-8 h-full hover:border-purple-500/50 transition group">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="absolute top-4 right-4 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
              {i < 4 && (
                <div className="hidden md:block absolute top-1/3 -right-3 text-purple-500">
                  <ChevronRight size={24} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* DETAILED FLOW SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">The Complete Brand Journey</h2>
          <p className="text-xl text-gray-400">From discovery to payment, we handle it all</p>
        </motion.div>

        <div className="space-y-8">
          {/* Step 1: Package Creation */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">📦</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 1: Create Your Packages</h3>
              <p className="text-gray-300 mb-4">
                Define what you're offering to creators. Each package can include specific deliverables (reels, posts, stories), duration, timeline, and pricing. You can create multiple tiers to attract different creator levels.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Create tiered packages (Nano, Micro, Macro) to maximize your reach across different creator segments.
              </div>
            </div>
          </motion.div>

          {/* Step 2: Browse & Discover */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-purple-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-pink-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">🔍</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 2: Discover Perfect Creators</h3>
              <p className="text-gray-300 mb-4">
                Search and filter creators by category (fashion, tech, beauty, etc.), follower count, engagement rate, and niche. View detailed analytics of each creator's audience to ensure alignment with your brand values.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Look beyond follower counts. High engagement rates often deliver better ROI than large inactive audiences.
              </div>
            </div>
          </motion.div>

          {/* Step 3: Send Collaboration Requests */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">📨</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 3: Send Collaboration Requests</h3>
              <p className="text-gray-300 mb-4">
                Send your package proposal to creators. Include brief details about what you're looking for. Creators can accept, counter-offer, or decline. All communication happens in one place with clear visibility.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Personalize your requests. Creators respond better to brands that show they understand their content style.
              </div>
            </div>
          </motion.div>

          {/* Step 4: Content Review & Approval */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-purple-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-pink-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">✅</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 4: Review & Approve Content</h3>
              <p className="text-gray-300 mb-4">
                Once creators submit their draft content, you can review it directly in BrandOrbit. Approve it or request improvements with detailed feedback. No back-and-forth through DMs or emails.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Give clear feedback with specific examples. This helps creators deliver exactly what you need.
              </div>
            </div>
          </motion.div>

          {/* Step 5: Secure Payment & Publishing */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-purple-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">💳</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 5: Payment & Publishing</h3>
              <p className="text-gray-300 mb-4">
                Pay via Razorpay (UPI, Card, NetBanking, Wallet). Your payment is securely held in escrow. Once content is published, creators get 90% immediately and platform keeps 10% as commission.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Escrow protects both you and the creator, ensuring quality content gets published.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KEY FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Powerful Features for Brands</h2>
          <p className="text-xl text-gray-400">Everything you need to manage successful collaborations</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Target size={32} />, title: "Smart Creator Matching", desc: "AI-powered recommendations based on your brand fit and audience demographics." },
            { icon: <Shield size={32} />, title: "Secure Escrow Payments", desc: "Protected transactions with Razorpay integration for safe brand-creator exchanges." },
            { icon: <TrendingUp size={32} />, title: "Analytics Dashboard", desc: "Real-time tracking of collaborations, spending, and ROI metrics." },
            { icon: <Users size={32} />, title: "Bulk Management", desc: "Manage multiple creators and campaigns simultaneously from one dashboard." },
            { icon: <Zap size={32} />, title: "Instant Notifications", desc: "Get real-time updates when creators accept, submit, or complete deliverables." },
            { icon: <Sparkles size={32} />, title: "Content Approval Workflow", desc: "Streamlined review process with feedback tools and version history." }
          ].map((feature, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/50 hover:bg-purple-500/20 transition group">
              <div className="text-purple-400 mb-4 group-hover:text-pink-400 transition">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WHY BRANDS LOVE US */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Why Brands Choose BrandOrbit</h2>
          <p className="text-xl text-gray-400">Join 500+ brands already collaborating successfully</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "⏱️ 10x Faster", desc: "What took weeks of email negotiations now happens in days." },
            { title: "💰 Better ROI", desc: "Transparent pricing and performance tracking ensures every rupee counts." },
            { title: "🤝 Quality Content", desc: "Review and approval process ensures high-quality, on-brand deliverables." },
            { title: "📊 Full Visibility", desc: "Real-time dashboards show collaboration status, spending, and performance metrics." },
            { title: "🔒 Payment Security", desc: "Escrow system protects both brands and creators with transparent transactions." },
            { title: "🚀 Easy Scaling", desc: "Manage 5 or 500 collaborations with the same ease and efficiency." }
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} className="flex gap-4 items-start">
              <div className="text-3xl flex-shrink-0">{item.title.split(" ")[0]}</div>
              <div>
                <h4 className="text-xl font-bold mb-2">{item.title.split(" ").slice(1).join(" ")}</h4>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* PRICING PLANS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-400">Only pay commission when collaborations complete</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Starter", price: "Free", features: ["Up to 5 active collaborations", "Basic analytics", "Email support"] },
            { name: "Pro", price: "10% per collab", features: ["Unlimited collaborations", "Advanced analytics", "Priority support", "Bulk creator search"], popular: true },
            { name: "Enterprise", price: "Custom", features: ["Dedicated account manager", "Custom integrations", "White-label options", "24/7 support"] }
          ].map((plan, i) => (
            <motion.div key={i} {...fadeInUp} className={`rounded-2xl p-8 border transition ${plan.popular ? "bg-gradient-to-b from-purple-600 to-pink-600 border-purple-400 scale-105" : "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/50"}`}>
              {plan.popular && <div className="text-xs font-bold bg-yellow-400 text-black w-fit px-3 py-1 rounded-full mb-4">POPULAR</div>}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex gap-2 items-center">
                    <span className="text-green-400">✓</span> {feat}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-bold transition ${plan.popular ? "bg-black hover:bg-black/80" : "border border-purple-500 hover:bg-purple-500/10"}`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div {...staggerContainer} className="space-y-4">
          {[
            { q: "How does payment work?", a: "You pay via Razorpay when content is approved. We hold 10% commission and creators receive 90% immediately upon publishing." },
            { q: "Can I request revisions?", a: "Yes! Our content review workflow lets you request improvements before approving and paying for the collaboration." },
            { q: "How long does a collaboration take?", a: "Typically 1-4 weeks from proposal to published content, depending on your requirements and creator availability." },
            { q: "What if the creator doesn't deliver?", a: "You can request improvements or cancel before payment is released. Your funds are protected in escrow throughout the process." },
            { q: "How do I find the right creators?", a: "Use our advanced search filters for niche, audience size, engagement rate, and location. You can also browse curated recommendations." },
            { q: "Is there a minimum commitment?", a: "No! Start with one collaboration or scale to hundreds. You only pay when collaborations complete." }
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 hover:bg-purple-500/20 transition cursor-pointer group">
              <h4 className="text-lg font-bold mb-2 group-hover:text-purple-300 transition">{item.q}</h4>
              <p className="text-gray-400">{item.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Launch Your First Campaign?</h2>
          <p className="text-lg mb-8 text-gray-100">Join 500+ brands transforming their influencer marketing</p>
          <Link href="/api/auth/signin">
            <button className="bg-black hover:bg-black/80 px-8 py-4 rounded-xl font-bold text-lg transition">
              Sign Up Now <ChevronRight className="inline ml-2" size={20} />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-purple-500/10 bg-black/20 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400">Features</a></li>
                <li><a href="#" className="hover:text-purple-400">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-400">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400">About</a></li>
                <li><a href="#" className="hover:text-purple-400">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Creators</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/creator" className="hover:text-purple-400">For Creators</a></li>
                <li><a href="#" className="hover:text-purple-400">Creator Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400">Privacy</a></li>
                <li><a href="#" className="hover:text-purple-400">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-500/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 BrandOrbit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BrandPage;
