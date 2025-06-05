"use client"

import Image from "next/image"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg"
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  const logoSize = sizeClasses[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <Image
          src="/images/evertwine-logo.png"
          alt="Evertwine Logo"
          width={logoSize.width}
          height={logoSize.height}
          className="rounded-md"
          priority
        />
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
