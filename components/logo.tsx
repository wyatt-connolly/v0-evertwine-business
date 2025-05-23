"use client"

import { Sparkles } from "lucide-react"

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
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg blur-sm opacity-75"></div>
        <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-1.5 shadow-lg">
          <Sparkles className={`${sizeClasses[size]} text-white`} />
        </div>
      </div>
      {showText && (
        <span
          className={`font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}
        >
          Evertwine
        </span>
      )}
    </div>
  )
}
