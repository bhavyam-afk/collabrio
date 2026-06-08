import Card from "./Card";
import React from 'react'

const features = [
  {
    title: "AI-Powered Matching",
    description: "Information Retrival System pipeline designed with RRF and hybrid search that is a combination of traditional BM-25 and sematic matching using cosine similarity on document embeddings made in FAISS. Has LLM Layers for query understanding, spell corrections and final result evaluations.",
  },
  {
    title: "S3 Storage",
    description: "Amazon AWS S3 (Simple Storage Service) is used for storing creator drafts and other files such as creator/ brand profile pictures. Dedicated and clean routing for each use case has been done in a single bucket.",
  },
  {
    title: "Secure RazorPay Payments",
    description: "Escrow flow of payment has been implemented partially to make the platform be first to solve the biggest flow of this industry that is payment failures. Collabrio holds the payment till collab is not cancelled, after it is approved by brand money moves to the creator.",
  },
  {
    title: "Meta Connectivity",
    description: "We at Collabrio believe in data driven decisions, So here is Meta OAuth for up-to date analytics of creators that help grow creators and brands both in their respective fields.",
  },
  {
    title: "RESTful API Suite",
    description: "Implemented 20+ RESTful APIs for seamless integration and data exchange. Also we have implemented a clean and highly scalable database schema in PostgreSQL with 14 tables and 13 enums that help define each state very clearly.",
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