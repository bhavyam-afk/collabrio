
"use client";

import GlassCard from "../ui/glass-card";

interface CardProps {
  title: string;
  description: string;
}

function getCardIcon(title: string): React.ReactNode {
  switch (title) {
    case "AI-Powered Matching":
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#6366f1" />
          <path d="M12 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="20" r="3" fill="#fff" />
        </svg>
      );
    case "Campaign Analytics":
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#10b981" />
          <rect x="12" y="22" width="4" height="6" fill="#fff" />
          <rect x="18" y="18" width="4" height="10" fill="#fff" />
          <rect x="24" y="14" width="4" height="14" fill="#fff" />
        </svg>
      );
    case "Secure Payments":
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#f59e42" />
          <rect x="12" y="16" width="16" height="10" rx="2" fill="#fff" />
          <circle cx="20" cy="21" r="2" fill="#f59e42" />
        </svg>
      );
    case "Global Reach":
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#38bdf8" />
          <path d="M20 10a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#fff" strokeWidth="2" />
          <path d="M20 10v20M10 20h20" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case "Success Stories":
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#e879f9" />
          <path d="M14 24l6-8 6 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#64748b" />
          <text x="20" y="25" textAnchor="middle" fontSize="12" fill="#fff">?</text>
        </svg>
      );
  }
}

export default function Card({ title, description }: CardProps) {
  return (
    <GlassCard title={title} description={description} logo={getCardIcon(title)} />
  );
}
