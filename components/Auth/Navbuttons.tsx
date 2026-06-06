"use client";

import React, { useState } from 'react';
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import LoginCard from './LoginCard';
import SignupCard from './SignupCard';

interface NavbuttonsProps {
  type: "login" | "signup";
}

const Navbuttons = ({ type }: NavbuttonsProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cardType, setCardType] = useState<null | "brand" | "creator">(null);
  const isLogin = type === "login";

  function handleDropdown(choice: "brand" | "creator") {
    setCardType(choice);
    setDropdownOpen(false);
  }

  function handleClose() {
    setCardType(null);
  }

  return (
    <>
      <div className="relative">
        <LiquidButton
          className={isLogin ? "rounded-2xl font-semibold w-24" : "rounded-2xl font-semibold w-24 "}
          onClick={() => {setDropdownOpen((open) => !open)}}
        >
          {isLogin ? "Login" : "Signup"}
        </LiquidButton>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-[#222] rounded-lg shadow-lg z-40">
            <button
              className="block w-full px-6 py-3 text-left text-white hover:bg-blue-700 rounded-t-lg"
              onClick={() => handleDropdown("brand")}
            >
              {isLogin ? "As Brand" : "As Brand"}
            </button>
            <button
              className="block w-full px-6 py-3 text-left text-white hover:bg-purple-700 rounded-b-lg"
              onClick={() => handleDropdown("creator")}
            >
              {isLogin ? "As Creator" : "As Creator"}
            </button>
          </div>
        )}
      </div>
      {cardType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div className="relative">
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-900"
              onClick={handleClose}
              aria-label="Close"
            >
              X
            </button>
            {isLogin ? <LoginCard userType={cardType} /> : <SignupCard userType={cardType} />}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbuttons;