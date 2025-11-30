"use client";

import { useState, useEffect } from "react";

// SVG paths for the three morphing icons
const TrimmerIcon = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-24 h-24 md:w-32 md:h-32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Electric Trimmer - Teal/Cyan color */}
    <rect x="30" y="20" width="40" height="60" rx="8" fill="#0D9488" />
    <rect x="35" y="25" width="30" height="20" rx="4" fill="#14B8A6" />
    <rect x="38" y="80" width="24" height="8" rx="2" fill="#0F766E" />
    <rect x="42" y="88" width="16" height="4" rx="1" fill="#115E59" />
    <circle cx="50" cy="55" r="8" fill="#5EEAD4" />
    <rect x="46" y="52" width="8" height="6" rx="1" fill="#0D9488" />
  </svg>
);

const SmartwatchIcon = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-24 h-24 md:w-32 md:h-32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Smartwatch - Pink/Salmon color */}
    <rect x="30" y="10" width="40" height="16" rx="4" fill="#FDA4AF" />
    <rect x="30" y="74" width="40" height="16" rx="4" fill="#FDA4AF" />
    <rect x="25" y="22" width="50" height="56" rx="10" fill="#FB7185" />
    <rect x="30" y="28" width="40" height="44" rx="6" fill="#0F172A" />
    <circle cx="50" cy="50" r="14" stroke="#FB7185" strokeWidth="2" fill="none" />
    <line x1="50" y1="50" x2="50" y2="40" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="50" x2="58" y2="54" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="50" r="2" fill="#FB7185" />
  </svg>
);

const GroceryBagIcon = () => (
  <svg
    viewBox="0 0 100 100"
    className="w-24 h-24 md:w-32 md:h-32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Grocery Bag - Green & Brown color */}
    <path
      d="M25 35 L30 90 L70 90 L75 35 Z"
      fill="#8B5A2B"
    />
    <path
      d="M28 40 L32 85 L68 85 L72 40 Z"
      fill="#A0522D"
    />
    <path
      d="M35 25 Q35 15 50 15 Q65 15 65 25 L65 35 L35 35 Z"
      fill="none"
      stroke="#8B5A2B"
      strokeWidth="4"
    />
    {/* Vegetables peeking out */}
    <ellipse cx="42" cy="38" rx="6" ry="10" fill="#22C55E" />
    <ellipse cx="50" cy="36" rx="5" ry="12" fill="#16A34A" />
    <ellipse cx="58" cy="38" rx="6" ry="10" fill="#22C55E" />
    <path d="M48 24 Q50 18 52 24" stroke="#15803D" strokeWidth="2" fill="none" />
  </svg>
);

interface SplashAnimationProps {
  className?: string;
}

export function SplashAnimation({ className = "" }: SplashAnimationProps) {
  const [currentIcon, setCurrentIcon] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const icons = [
    { component: TrimmerIcon, key: "trimmer" },
    { component: SmartwatchIcon, key: "smartwatch" },
    { component: GroceryBagIcon, key: "grocery" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIcon((prev) => (prev + 1) % icons.length);
        setIsAnimating(false);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [icons.length]);

  const CurrentIconComponent = icons[currentIcon].component;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* White background container */}
      <div className="bg-white min-h-screen w-full flex flex-col items-center justify-center relative">
        {/* Morphing Icon Container */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`transition-all duration-300 ${
              isAnimating
                ? "scale-75 opacity-0"
                : "scale-100 opacity-100 animate-splash-bounce-in"
            }`}
          >
            <CurrentIconComponent />
          </div>
        </div>

        {/* Typography at bottom - 20% from bottom */}
        <div className="absolute bottom-[20%] left-0 right-0 text-center px-4">
          <p className="text-lg md:text-xl font-medium shimmer-text">
            Everything you need, delivered in minutes
          </p>
        </div>
      </div>
    </div>
  );
}

export default SplashAnimation;
