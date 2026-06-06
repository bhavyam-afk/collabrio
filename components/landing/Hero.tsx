"use client" ;

import React from 'react'

const Hero = () => {
    return (
    <>
    <div className="relative w-full min-h-150 flex flex-col items-center justify-centfer shadow-2xl mt-20">
        <div className="relative z-10 flex flex-row w-full max-w-7xl mx-auto py-20 px-8 gap-16">
            {/* left main description  */}
            <div className="flex flex-col items-center justify-center w-1/2 pr-12">
                <h1 className="handlee-regular text-5xl font-extrabold mb-6 text-center drop-shadow-2xl text-white tracking-wide">Welcome to Collabrio!</h1>
                <p className="text-2xl text-gray-300 mb-12 text-center max-w-2xl leading-relaxed">The space where brands and influencers connect, collaborate, and launch successful campaigns. Explore our features below! It is a one stop platform for best connectivity and Marketing. Hope you find best people here.</p>
            </div>
            {/* right main description: Milestone timeline */}
            <div className="flex flex-col items-center justify-center w-1/2 pl-12">
                <h2 className="text-3xl font-bold mb-10 text-center text-yellow-300 tracking-wide">Our Key Milestones</h2>
                <div className="flex flex-row items-center justify-center gap-8 flex-wrap">
                    {/* Milestone timeline circles */}
                    {[
                        { icon: "📢", value: "4000+", label: "Campaigns" },
                        { icon: "👥", value: "750k+", label: "Creators" },
                        { icon: "💛", value: "7.5B+", label: "Reach" },
                        { icon: "🏭", value: "30+", label: "Sectors" },
                        { icon: "🌐", value: "30+", label: "Languages" },
                        { icon: "⭐", value: "4.5+", label: "App Rating" },
                    ].map((m, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className="bg-linear-to-br from-[#ffe066] via-[#f7c873] to-[#7b52d3] rounded-full p-6 mb-3 shadow-xl border-4 border-yellow-200" style={{ minWidth: 90, minHeight: 90 }}>
                                <span className="text-4xl drop-shadow-lg" role="img" aria-label={m.label}>{m.icon}</span>
                            </div>
                            <span className="text-yellow-300 font-extrabold text-xl mb-1">{m.value}</span>
                            <span className="text-gray-200 text-base font-medium tracking-wide">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* Moving brand logo window */}
        <div className="w-[80vw] mx-auto overflow-hidden py-8 mt-2">
            <div className="flex items-center gap-16" style={{ animation: 'scroll-logos 20s linear infinite', width: 'max-content' }}>
                {/* Repeat logos twice for infinite effect */}
                {[...Array(2)].flatMap((_, repeatIdx) => [1,2,3,4,5,6,7,8].map(i => (
                    <div key={`${repeatIdx}-${i}`} className="flex items-center justify-center h-20 w-40 bg-white rounded-xl shadow-lg">
                        <span className="text-3xl font-bold text-gray-700">Logo {i}</span>
                    </div>
                )))}
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