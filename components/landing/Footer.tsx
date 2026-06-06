import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-10">
      <div className="container mx-auto flex flex-row items-start gap-12 justify-between">
        {/* Left: Social + Feedback Form */}
        <div className="flex flex-col gap-8 w-full max-w-md">
          <div className="flex gap-6 mb-2">
            <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram"><span className="text-3xl">📸</span></a>
            <a href="#" target="_blank" rel="noopener noreferrer" title="Twitter"><span className="text-3xl">🐦</span></a>
            <a href="#" target="_blank" rel="noopener noreferrer" title="LinkedIn"><span className="text-3xl">💼</span></a>
            <a href="#" target="_blank" rel="noopener noreferrer" title="YouTube"><span className="text-3xl">▶️</span></a>
          </div>
          <form className="bg-gray-800 rounded-lg p-6 flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2">Feedback</h3>
            <input type="text" placeholder="Your Name" className="px-4 py-2 rounded bg-gray-700 text-white focus:outline-none" />
            <input type="email" placeholder="Your Email" className="px-4 py-2 rounded bg-gray-700 text-white focus:outline-none" />
            <textarea placeholder="Your Feedback" className="px-4 py-2 rounded bg-gray-700 text-white focus:outline-none" rows={3} />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold">Submit</button>
          </form>
        </div>
        {/* Right: Info Columns */}
        <div className="flex flex-row gap-16 w-full justify-end">
          <div>
            <h4 className="text-lg font-bold text-[#e3eeb1] mb-3">Company</h4>
            <ul className="space-y-2 text-gray-200">
              <li>About us</li>
              <li>Contact us</li>
              <li>Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#e3eeb1] mb-3">What we do</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Platform overview</li>
              <li>By campaign strategy</li>
              <li>Agency services</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#e3eeb1] mb-3">Support</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Brand support</li>
              <li>Creator support</li>
              <li>Contact sales</li>
              <li>Creator sign up</li>
              <li>Partner program</li>
              <li>Join the Slack Community</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#e3eeb1] mb-3">Free Resources</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Influencer brief</li>
              <li>Campaign ROI deck</li>
              <li>Pre-written email templates</li>
              <li>The state of influencer marketing</li>
              <li>Marketing courses</li>
              <li>Budget template</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-[#e3eeb1] mb-3">Trust center</h4>
            <ul className="space-y-2 text-gray-200">
              <li>Privacy policy</li>
              <li>Terms of service</li>
              <li>Subscription services agreement</li>
              <li>Responsible disclosure policy</li>
              <li>Acceptable use policy</li>
              <li>Handling and Processing Fees</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6 text-sm text-gray-400 text-center">© 2025 Brand Orbit. All rights reserved.</div>
    </footer>
  );
}