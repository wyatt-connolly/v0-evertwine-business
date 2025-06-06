"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  rounded?: boolean
  variant?: "default" | "white" | "dark"
}

export function Logo({ className = "", showText = true, size = "md", rounded = true, variant = "default" }: LogoProps) {
  const sizeClasses = {
    sm: { width: 20, height: 20 },
    md: { width: 28, height: 28 },
    lg: { width: 40, height: 40 },
    xl: { width: 56, height: 56 },
  }

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  const textVariants = {
    default: "bg-gradient-to-r from-evertwine-600 to-evertwine-700 bg-clip-text text-transparent",
    white: "text-white",
    dark: "text-foreground",
  }

  const logoSize = sizeClasses[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex-shrink-0">
        <Image
          src="/images/evertwine-logo.png"
          alt="Evertwine Logo"
          width={logoSize.width}
          height={logoSize.height}
          className={cn("transition-transform duration-200 hover:scale-105", rounded && "rounded-lg shadow-sm")}
          priority
        />
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight transition-colors duration-200",
            textSizeClasses[size],
            textVariants[variant],
          )}
        >
          Evertwine
        </span>
      )}
    </div>
  )
}
