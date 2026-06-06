"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Star, Zap, DollarSign, TrendingUp, Shield, Users, Award } from "lucide-react";

const CreatorPage = () => {
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
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[#0b0e27]/80 border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-cyan-400">BrandOrbit</div>
          <div className="flex gap-6 items-center">
            <a href="/brand" className="hover:text-cyan-300 transition">For Brands</a>
            <Link href="/api/auth/signin" className="bg-cyan-600 hover:bg-cyan-700 px-6 py-2 rounded-lg transition">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div {...fadeInUp}>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-600 bg-clip-text text-transparent">
            Monetize Your Influence Today
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Get paid for creating content you love. Connect with brands, grow your audience, and build sustainable income streams on BrandOrbit.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/api/auth/signin">
              <button className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition text-lg">
                Start Earning Now
              </button>
            </Link>
            <button className="border border-cyan-500 px-8 py-4 rounded-xl font-semibold hover:bg-cyan-500/10 transition text-lg">
              See Opportunities
            </button>
          </div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div {...staggerContainer} className="grid grid-cols-3 gap-6 mt-16">
          {[
            { number: "₹50,000", label: "Avg Earning per Collab" },
            { number: "10K+", label: "Active Creators" },
            { number: "500+", label: "Monthly Opportunities" }
          ].map((stat, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-cyan-500/10 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
              <div className="text-3xl font-bold text-cyan-400">{stat.number}</div>
              <div className="text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Your Creator Journey in 6 Steps</h2>
          <p className="text-xl text-gray-400">From signup to payment in the easiest way possible</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[
            {
              step: 1,
              title: "Join",
              description: "Sign up with your Instagram/social handles and let us analyze your audience.",
              icon: "🎯"
            },
            {
              step: 2,
              title: "Create Profile",
              description: "Set your rates, niches, and availability. Showcase your best content.",
              icon: "✨"
            },
            {
              step: 3,
              title: "Receive Requests",
              description: "Brands send collaboration requests tailored to your audience and niche.",
              icon: "📬"
            },
            {
              step: 4,
              title: "Negotiate",
              description: "Accept, counter-offer, or decline. You control the terms and pricing.",
              icon: "🤝"
            },
            {
              step: 5,
              title: "Create Content",
              description: "Submit your draft content for brand review and approval.",
              icon: "🎬"
            },
            {
              step: 6,
              title: "Get Paid",
              description: "Publish and earn! 90% of payment goes to your wallet immediately.",
              icon: "💰"
            }
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} className="relative">
              <div className="bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6 h-full hover:border-cyan-500/50 transition group">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
              {i < 5 && (
                <div className="hidden md:block absolute top-1/3 -right-2 text-cyan-500">
                  <ChevronRight size={20} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* DETAILED LIFECYCLE SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Your Complete Creator Lifecycle</h2>
          <p className="text-xl text-gray-400">Build sustainable income from day one</p>
        </motion.div>

        <div className="space-y-8">
          {/* Step 1: Join & Profile */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-cyan-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">🎯</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 1: Join BrandOrbit</h3>
              <p className="text-gray-300 mb-4">
                Sign up with just your email or social handles. We analyze your Instagram/TikTok/YouTube profile to understand your niche, audience demographics, and engagement rates. This helps us match you with the right brands.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Connect multiple platforms! Brands look for creators with diverse reach across different channels.
              </div>
            </div>
          </motion.div>

          {/* Step 2: Create Profile */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">✨</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 2: Set Up Your Creator Profile</h3>
              <p className="text-gray-300 mb-4">
                Customize your profile with your bio, categories (fashion, tech, beauty, fitness, etc.), rates, and content types you create (reels, posts, stories, videos). Set your availability and any specific brand preferences or exclusions.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Be specific about your rates and deliverables. Brands respect transparency and are more likely to collaborate.
              </div>
            </div>
          </motion.div>

          {/* Step 3: Browse & Discover */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-cyan-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">🔍</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 3: Receive Collaboration Requests</h3>
              <p className="text-gray-300 mb-4">
                Brands discover your profile and send you collaboration requests. Each request includes package details, deliverables, timeline, and compensation. You'll see everything clearly before committing—no surprises.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Check notifications regularly. Hot opportunities get snapped up fast!
              </div>
            </div>
          </motion.div>

          {/* Step 4: Negotiate & Accept */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">🤝</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 4: Negotiate & Agree</h3>
              <p className="text-gray-300 mb-4">
                You have full control. Accept the offer as-is, counter-offer with different rates or terms, or politely decline. Negotiation happens directly in the app with full transparency. No awkward DM conversations.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Don't accept every offer. It's better to do fewer high-quality collaborations than many that don't align with your brand.
              </div>
            </div>
          </motion.div>

          {/* Step 5: Create & Submit */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-cyan-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">🎬</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 5: Create & Submit Content</h3>
              <p className="text-gray-300 mb-4">
                Create amazing content that aligns with the brand brief. Upload your draft directly to BrandOrbit for brand review. If they request changes, iterate until everyone is happy. No back-and-forth through emails or WhatsApp.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Communicate early if you need more time or clarification on requirements. Brands appreciate transparency.
              </div>
            </div>
          </motion.div>

          {/* Step 6: Get Paid */}
          <motion.div {...fadeInUp} className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-cyan-500/20 rounded-2xl p-8 flex gap-8 items-center">
            <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 text-2xl">💰</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Step 6: Publish & Earn</h3>
              <p className="text-gray-300 mb-4">
                Once approved, publish your content and get paid! You receive 90% of the collaboration fee immediately. The remaining 10% goes to BrandOrbit as our platform fee. Funds land in your wallet within 24 hours.
              </p>
              <div className="bg-black/30 p-4 rounded-lg text-sm text-gray-300">
                💡 <strong>Pro Tip:</strong> Withdraw to your bank account anytime. No minimum thresholds or hidden delays.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* EARNING POTENTIAL */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Earning Potential</h2>
          <p className="text-xl text-gray-400">Real numbers from our creator community</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              category: "Nano Influencer",
              followers: "1K - 10K",
              perCollab: "₹2,000 - ₹10,000",
              monthly: "₹40,000 - ₹200,000",
              desc: "Perfect for starting your creator journey"
            },
            {
              category: "Micro Influencer",
              followers: "10K - 100K",
              perCollab: "₹10,000 - ₹50,000",
              monthly: "₹200,000 - ₹1,00,000",
              desc: "Most active segment with steady opportunities",
              popular: true
            },
            {
              category: "Macro Influencer",
              followers: "100K+",
              perCollab: "₹50,000 - ₹2,00,000+",
              monthly: "₹1,00,000 - ₹5,00,000+",
              desc: "Premium brands competing for your attention"
            }
          ].map((tier, i) => (
            <motion.div key={i} {...fadeInUp} className={`rounded-2xl p-8 border transition ${tier.popular ? "bg-gradient-to-b from-cyan-600 to-blue-600 border-cyan-400 scale-105" : "bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/50"}`}>
              {tier.popular && <div className="text-xs font-bold bg-yellow-400 text-black w-fit px-3 py-1 rounded-full mb-4">MOST COMMON</div>}
              <h3 className="text-2xl font-bold mb-2">{tier.category}</h3>
              <div className="text-sm text-gray-200 mb-4">{tier.followers} followers</div>
              <div className="space-y-3 mb-6">
                <div>
                  <div className="text-xs text-gray-300">Per Collaboration</div>
                  <div className="text-2xl font-bold">{tier.perCollab}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-300">Potential Monthly</div>
                  <div className="text-2xl font-bold">{tier.monthly}</div>
                </div>
              </div>
              <p className="text-sm">{tier.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WHY CREATORS LOVE US */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Why Creators Choose BrandOrbit</h2>
          <p className="text-xl text-gray-400">Join 10K+ creators already earning</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <DollarSign size={32} />, title: "90% Payouts", desc: "Keep 90% of your earnings. Only 10% platform fee." },
            { icon: <Shield size={32} />, title: "Secure & Fair", desc: "Escrow payments protect you. Funds guaranteed." },
            { icon: <Zap size={32} />, title: "Fast Payments", desc: "Get paid within 24 hours of publishing." },
            { icon: <Users size={32} />, title: "Zero Pressure", desc: "You control everything—rates, timeline, everything." },
            { icon: <Star size={32} />, title: "Smart Matching", desc: "Only receive requests aligned with your niche." },
            { icon: <TrendingUp size={32} />, title: "Growth Tools", desc: "Analytics dashboard to track your growth & earnings." }
          ].map((feature, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 hover:bg-cyan-500/20 transition group">
              <div className="text-cyan-400 mb-4 group-hover:text-blue-400 transition">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Creator Success Stories</h2>
          <p className="text-xl text-gray-400">Real creators, real earnings, real impact</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Priya (@fashionista_priya)",
              followers: "45K followers",
              story: "Went from random brand DMs to 8-10 structured collaborations per month earning ₹2,00,000+",
              quote: "BrandOrbit made influencer marketing feel professional and profitable."
            },
            {
              name: "Arjun (@tech_junkie)",
              followers: "28K followers",
              story: "Diversified from YouTube ads to multiple brand partnerships, tripled his monthly income",
              quote: "The escrow system gave me peace of mind. Brands couldn't ghost me anymore."
            },
            {
              name: "Aisha (@wellness_guru)",
              followers: "62K followers",
              story: "Found 15+ quality collaborations in first 3 months, built sustainable passive income",
              quote: "Finally, a platform that treats creators as professionals, not just content machines."
            }
          ].map((story, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-8 hover:border-cyan-500/50 transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center font-bold">
                  {story.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{story.name}</h4>
                  <p className="text-sm text-gray-400">{story.followers}</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4 italic">"{story.quote}"</p>
              <p className="text-sm text-gray-400">{story.story}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ANALYTICS & GROWTH */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Track Your Growth</h2>
          <p className="text-xl text-gray-400">Analytics dashboard for creators</p>
        </motion.div>

        <motion.div {...staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "📊 Earnings Dashboard", desc: "Real-time view of all your collaborations, payouts, and income trends." },
            { title: "🎯 Performance Metrics", desc: "Track engagement, views, and ROI for each collaboration." },
            { title: "📅 Schedule View", desc: "Never miss a deadline with your organized collaboration calendar." },
            { title: "💬 Direct Messaging", desc: "Communicate with brands without switching platforms." },
            { title: "📈 Growth Insights", desc: "Understand which collaborations drive the most engagement." },
            { title: "💳 Wallet Management", desc: "View balance, transaction history, and withdrawal options." }
          ].map((feature, i) => (
            <motion.div key={i} {...fadeInUp} className="flex gap-4 items-start bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 hover:bg-cyan-500/10 transition">
              <div className="text-3xl flex-shrink-0">{feature.title.split(" ")[0]}</div>
              <div>
                <h4 className="text-lg font-bold mb-2">{feature.title.split(" ").slice(1).join(" ")}</h4>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
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
            { q: "Do I need a minimum follower count?", a: "No! We work with creators of all sizes. From 1K to 1M followers—we have brands looking for every creator level." },
            { q: "How much does BrandOrbit take?", a: "Just 10% commission on completed collaborations. You keep 90%. No hidden fees, no surprise charges." },
            { q: "Can I set my own rates?", a: "Absolutely! You set your rates, and brands see them upfront. You control every collaboration term." },
            { q: "How long does payment take?", a: "Within 24 hours of publishing. Funds go directly to your wallet, and you can withdraw anytime with no minimums." },
            { q: "What if a brand's requirements change?", a: "You can renegotiate or decline. You're in control. If something doesn't align with your values, say no." },
            { q: "Can I collaborate with multiple brands?", a: "Yes! You can work with unlimited brands simultaneously. Just manage your time and deliverables." },
            { q: "What about brand safety and quality?", a: "All brands are verified. We encourage you to review each request carefully. You have full veto power." },
            { q: "Can I use the content after the collaboration?", a: "Depends on your agreement. Discuss content rights with the brand before accepting." }
          ].map((item, i) => (
            <motion.div key={i} {...fadeInUp} className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 hover:bg-cyan-500/20 transition cursor-pointer group">
              <h4 className="text-lg font-bold mb-2 group-hover:text-cyan-300 transition">{item.q}</h4>
              <p className="text-gray-400">{item.a}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <motion.div {...fadeInUp} className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Monetize Your Influence?</h2>
          <p className="text-lg mb-8 text-gray-100">Join 10K+ creators already earning with BrandOrbit</p>
          <Link href="/api/auth/signin">
            <button className="bg-black hover:bg-black/80 px-8 py-4 rounded-xl font-bold text-lg transition">
              Start Earning Now <ChevronRight className="inline ml-2" size={20} />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-cyan-500/10 bg-black/20 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">For Creators</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400">How It Works</a></li>
                <li><a href="#" className="hover:text-cyan-400">Creator Resources</a></li>
                <li><a href="#" className="hover:text-cyan-400">Earnings Potential</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400">About</a></li>
                <li><a href="#" className="hover:text-cyan-400">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Brands</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/brand" className="hover:text-cyan-400">For Brands</a></li>
                <li><a href="#" className="hover:text-cyan-400">Brand Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cyan-500/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 BrandOrbit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CreatorPage;
