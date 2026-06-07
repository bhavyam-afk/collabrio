"use client";

import { LiquidButton } from "@/components/ui/liquid-glass-button";
import React from "react";

interface NavButtonsProps {
  onLoginClick: () => void
  onSignupClick: () => void
}

const NavButtons = ({ onLoginClick, onSignupClick }: NavButtonsProps) => {
  return (
    <div className="flex gap-4">
      <LiquidButton
        className="rounded-2xl font-semibold"
        onClick={onLoginClick}
      >
        Log in
      </LiquidButton>
      <LiquidButton
        className="rounded-2xl font-semibold text-slate-950"
        onClick={onSignupClick}
      >
        Get started
      </LiquidButton>
    </div>
  )
}

export default NavButtons;
