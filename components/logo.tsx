"use client"

import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          <Image
            src="/images/evertwine-logo.png"
            alt="Evertwine Logo"
            width={size === "lg" ? 48 : size === "md" ? 32 : 24}
            height={size === "lg" ? 48 : size === "md" ? 32 : 24}
            className="rounded-md"
          />
        </div>
      </div>
      {showText && (
        <span
          className={`font-bold bg-gradient-to-r from-evertwine-600 to-evertwine-700 bg-clip-text text-transparent ${textSizeClasses[size]}`}
        >
          Evertwine
        </span>
      )}
    </div>
  )
}
