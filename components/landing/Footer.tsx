import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8 mt-10 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand / description */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M4 12h16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 7h16" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">Collabrio</div>
                <div className="text-sm text-gray-400 max-w-xs">Connecting brands and creators — campaign management, discovery, and analytics in one platform.</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex gap-3">
                <a href="https://www.instagram.com/collabrio.ai/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                  </svg>
                </a>
                <a href="https://x.com/BhavyamMeh28130" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white" aria-label="X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M6 4l12 16M6 20L18 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a href="mailto:partners@collabrio.co.in" className="text-gray-400 hover:text-white" aria-label="Email">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              <form className="mt-4 bg-gray-800 rounded p-3" onSubmit={(e) => e.preventDefault()}>
                <label className="sr-only">Name</label>
                <input type="text" placeholder="Your name" className="w-full mb-2 px-3 py-2 rounded bg-gray-900 text-gray-100 text-sm" />
                <label className="sr-only">Email</label>
                <input type="email" placeholder="you@company.com" className="w-full mb-2 px-3 py-2 rounded bg-gray-900 text-gray-100 text-sm" />
                <label className="sr-only">Message</label>
                <textarea placeholder="Short feedback" rows={3} className="w-full mb-2 px-3 py-2 rounded bg-gray-900 text-gray-100 text-sm" />
                <div className="text-right">
                  <button type="submit" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">Send</button>
                </div>
              </form>
            </div>
          </div>

          {/* Link groups */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">Company</h5>
              <ul className="text-sm text-gray-300 space-y-1 leading-tight">
                <li>About us</li>
                <li>Contact us</li>
                <li>Careers</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">What we do</h5>
              <ul className="text-sm text-gray-300 space-y-1 leading-tight">
                <li>Platform overview</li>
                <li>By campaign strategy</li>
                <li>Agency services</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">Support</h5>
              <ul className="text-sm text-gray-300 space-y-1 leading-tight">
                <li>Brand support</li>
                <li>Creator support</li>
                <li>Contact sales</li>
                <li>Creator sign up</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">Resources</h5>
              <ul className="text-sm text-gray-300 space-y-1 leading-tight">
                <li>Influencer brief</li>
                <li>Campaign ROI deck</li>
                <li>Pre-written templates</li>
                <li>Marketing courses</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">Trust</h5>
              <ul className="text-sm text-gray-300 space-y-1 leading-tight">
                <li>Privacy policy</li>
                <li>Terms of service</li>
                <li>Subscription agreement</li>
                <li>Responsible disclosure</li>
              </ul>
            </div>
          </div>

          {/* Right: newsletter / small CTA */}
          <div className="md:col-span-2">
            <h5 className="text-sm font-semibold text-[#e3eeb1] mb-2">Stay updated</h5>
            <p className="text-sm text-gray-400 mb-3">Get product updates and marketing tips.</p>
            <form className="flex items-center gap-2">
              <input aria-label="Email address" type="email" placeholder="you@company.com" className="w-full px-3 py-2 rounded bg-gray-800 text-gray-200 text-sm focus:outline-none" />
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-2 rounded">Subscribe</button>
            </form>
            <div className="mt-6 text-xs text-gray-500">© {new Date().getFullYear()} Collabrio. All rights reserved.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}