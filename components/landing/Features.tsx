import Card from "./Card";
import React from 'react'

const features = [
  {
    title: "AI-Powered Matching",
    description: "Discover the perfect partnerships with our intelligent matchmaking engine. By analyzing audience demographics, engagement patterns, and brand values, our AI ensures that influencers and brands connect in ways that drive real impact. No more guesswork—just smart, data-driven matches that deliver results.",
  },
  {
    title: "Campaign Analytics",
    description: "Stay ahead with real-time insights that matter. Our analytics dashboard goes beyond vanity metrics to show you true performance—reach, engagement, ROI, and more. With actionable reports and clear visualizations, you can optimize campaigns on the fly and make every collaboration count.",
  },
  {
    title: "Secure Payments",
    description: "We make financial transactions effortless and reliable. With built-in secure payment gateways and escrow protection, both brands and influencers enjoy peace of mind. Payments are fast, transparent, and safeguarded—ensuring trust and smooth collaboration every step of the way.",
  },
  {
    title: "Global Reach",
    description: "Expand your influence beyond borders. Our platform opens doors to a worldwide network of creators and brands, giving you opportunities to collaborate across industries and geographies. Whether you’re scaling locally or globally, we help you build authentic connections that grow your impact.",
  },
  {
    title: "Success Stories",
    description: "See what’s possible when collaboration meets innovation. From emerging startups to global enterprises, brands and influencers alike have achieved measurable growth with our platform. Be inspired by their journeys—and start creating your own success story with us.",
  },
];



const Features = () => {
  return (
    <div className="flex flex-wrap justify-center items-start gap-x-24 gap-y-16 mt-16 ">
      {features.map((feature, idx) => (
        <div key={idx} className={ idx % 2 === 0 ? "mb-24" : "mt-24" } style={{ width: "340px", minWidth: "280px" }}>
          <Card title={feature.title} description={feature.description} />
        </div>
      ))}
    </div>
  )
}

export default Features


// bg-gradient-to-br from-[#232946] via-[#1a1f3c] to-[#0a0f2c]