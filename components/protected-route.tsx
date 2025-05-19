"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/signup", "/forgot-password"]
  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    // Only redirect if not loading and user is not authenticated and not on a public path
    if (!loading && !user && !isPublicPath) {
      router.push("/login")
    }
  }, [user, loading, router, pathname, isPublicPath])

  // Don't show loading on public paths
  if (isPublicPath) {
    return <>{children}</>
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  // If not authenticated and not on a public path, don't render anything
  // (the useEffect will handle the redirect)
  if (!user && !isPublicPath) {
    return null
  }

  // User is authenticated or on a public path
  return <>{children}</>
}
