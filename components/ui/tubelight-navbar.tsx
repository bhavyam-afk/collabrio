"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/clients/utils"
import { motion } from "framer-motion"

interface NavItem {
  name: string
  url: string
  icon?: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
}

type DropdownKey = "Programs" | "Success Stories" | "Why BrandOrbit";
interface DropdownItem { label: string; href: string; }
const dropdowns: Record<DropdownKey, DropdownItem[]> = {
    Programs: [
        { label: "Campaigns", href: "#campaigns" },
        { label: "Affiliate Marketing", href: "#affiliate" },
    ],
    "Success Stories": [
        { label: "Company A", href: "#company-a" },
        { label: "Company B", href: "#company-b" },
        { label: "Company C", href: "#company-c" },
    ],
    "Why BrandOrbit": [
        { label: "Creators Love", href: "#creators-love" },
        { label: "ROI", href: "#roi" },
    ],
};


export function NavBaro({ items }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)
  const [hovered, setHovered] = useState<DropdownKey | null>(null);

  return (
    <div className={cn("relative flex items-center bg-white text-black py-1 px-5 overflow-visible")}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.name;
        const isHovered = hoveredTab === item.name;

        // Only show lamp/dash for the tab that is currently hovered, else active
        const showLamp = hoveredTab ? isHovered : isActive;
        const dropdownItems = (dropdowns as Record<string, DropdownItem[]>)[item.name];
        return (
          <div key={item.name} className="relative flex flex-col items-center" onMouseEnter={() => setHoveredTab(item.name)} onMouseLeave={() => setHoveredTab(null)} >
            {showLamp && (
              <>
                {/* Sleek lamp effect */}
                <motion.div layoutId="lamp" className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-2 z-40" initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="w-8 h-1.5 bg-black rounded-t-full opacity-80" />
                  <div className="absolute w-12 h-6 bg-black/15 rounded-full blur-md -top-1 -left-2" />
                  <div className="absolute w-8 h-6 bg-black/10 rounded-full blur-md -top-0.5 left-0" />
                  <div className="absolute w-5 h-5 bg-black/10 rounded-full blur-sm top-0 left-1.5" />
                </motion.div>
              </>
            )}
            <Link href={item.url} onClick={() => setActiveTab(item.name)}
              className={cn(
                "gap-3 cursor-pointer font-semibold px-5 py-2 rounded-xl transition-colors text-base min-w-[140px] whitespace-nowrap flex justify-center items-center",
                "text-black hover:text-black hover:bg-gray-50",
                isActive && "bg-gray-100 text-black shadow-sm",
              )}
            >
              {Icon && (
                <span>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
              )}
              <span className="inline whitespace-nowrap text-xs">{item.name}</span>
            </Link>

            {showLamp && dropdownItems && dropdownItems.length > 0 && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded shadow-lg z-50 min-w-[180px]">
                <div className="flex flex-col py-2">
                  {dropdownItems.map((d) => (
                    <Link key={d.href} href={d.href} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      {d.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}