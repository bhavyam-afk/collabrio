"use client" ;

import React from 'react'

const Hero = () => {
    return (
    <>
    <div className="relative w-full min-h-0 flex flex-col items-center justify-center shadow-2xl mt-14">
        <div className="relative z-10 flex flex-row w-full max-w-7xl mx-auto py-12 px-6 gap-12">
            {/* left main description  */}
            <div className="flex flex-col items-center justify-center w-1/2 pr-12">
                <h1 className="handlee-regular text-5xl font-extrabold mb-6 text-center drop-shadow-2xl text-white tracking-wide">Welcome to Collabrio 
                    
                </h1>
                <p className="text-2xl text-gray-300 mb-12 text-center max-w-2xl leading-relaxed">The space where brands and influencers connect, collaborate, and launch successful campaigns. Explore our features below! It is a one stop platform for best connectivity and Marketing. Hope you find best people here.</p>
            </div>
            {/* right main description: Milestone timeline */}
            <div className="flex flex-col items-center justify-center w-1/2 pl-12">
                <h2 className="handlee-regular text-3xl font-bold mb-10 text-center tracking-wide">Our Key Milestones</h2>
                <div className="flex flex-row items-center justify-center gap-8 flex-wrap">
                    {/* Milestone timeline circles */}
                    {[
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#4F46E5" />
                                                    <path d="M14 18L20 14L26 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M14 22V26C14 27.1046 14.8954 28 16 28H24C25.1046 28 26 27.1046 26 26V22" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M14 20H26" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M18 14V10H22V14" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            ), value: "4000+", label: "Packages" },
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#0EA5E9" />
                                                    <circle cx="14" cy="14" r="4" fill="#fff" />
                                                    <circle cx="26" cy="14" r="4" fill="#fff" />
                                                    <path d="M10 26C10 22 14 20 20 20C26 20 30 22 30 26V30H10V26Z" fill="#fff" />
                                                </svg>
                                            ), value: "750k+", label: "Creators" },
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#14B8A6" />
                                                    <path d="M12 26L17 21L21 25L28 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 29H28" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M20 12V16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M16 16L20 12L24 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ), value: "7.5M+", label: "Reach" },
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#F59E0B" />
                                                    <rect x="11" y="12" width="6" height="6" rx="2" fill="#fff" />
                                                    <rect x="23" y="12" width="6" height="6" rx="2" fill="#fff" />
                                                    <rect x="11" y="22" width="6" height="6" rx="2" fill="#fff" />
                                                    <rect x="23" y="22" width="6" height="6" rx="2" fill="#fff" />
                                                </svg>
                                            ), value: "20+", label: "Sectors" },
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#EC4899" />
                                                    <line x1="12" y1="24" x2="28" y2="24" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                                    <path d="M18 18L16 24L18 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M24 18L26 24L24 30" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M20 16V20" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                                </svg>
                                            ), value: "30+", label: "Languages" },
                                        { icon: (
                                                <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="20" cy="20" r="20" fill="#A855F7" />
                                                    <path d="M20 12L24 18L30 19L26 24L27 30L20 27L13 30L14 24L10 19L16 18L20 12Z" fill="#fff" />
                                                </svg>
                                            ), value: "4.5+", label: "App Rating" },
                    ].map((m, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                            <div className="flex items-center justify-center rounded-[50%] p-2 mb-2 bg-white/10 border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl" style={{ minWidth: 88, minHeight: 88 }}>
                                <span className="text-3xl" role="img" aria-label={m.label}>{m.icon}</span>
                            </div>
                            <span className="text-white font-semibold text-xl mb-1">{m.value}</span>
                            <span className="text-slate-300 text-sm font-medium tracking-wide">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* Moving brand logo window */}
        <div className="w-full max-w-6xl mx-auto overflow-hidden py-6 mt-0 px-4">
            <p className="text-center text-sm text-gray-300 mb-4">This is just a college project, not a real app.</p>
            <div className="flex items-center justify-center gap-10" style={{ animation: 'scroll-logos 20s linear infinite', width: 'max-content' }}>
                {/* Repeat logos twice for infinite effect */}
                {[...Array(2)].flatMap((_, repeatIdx) => [
                    "/logos/amazon.png",
                    "/logos/apple.png",
                    "/logos/budwiser.png",
                    "/logos/google.png",
                    "/logos/mcd.png",
                    "/logos/meta.png",
                    "/logos/openai.png",
                    "/logos/razorpay.png",
                    "/logos/stripe.png",
                ].map(src => {
                    const shouldInvert = ["amazon", "apple", "openai", "razorpay"].some(name => src.includes(name));
                    return (
                        <div key={`${repeatIdx}-${src}`} className={`flex items-center justify-center h-24 w-44 p-2 bg-transparent shadow-none ${shouldInvert ? 'invert' : ''}`}>
                            <img src={src} alt={`Brand logo ${src.split('/').pop()}`} className="h-full w-full object-contain" />
                        </div>
                    );
                }))}
            </div>
        </div>
        <style jsx>{`
            @keyframes scroll-logos {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
        `}</style>
    </div>
    </>
    )
}

export default Hero


//  bg-gradient-to-br from-[#0a0f2c] via-[#1a1f3c] to-[#232946]