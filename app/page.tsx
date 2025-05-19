"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If user is authenticated, redirect to dashboard
      // Otherwise, redirect to login page
      if (user) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  // Show loading spinner while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F9FAFB]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#6A0DAD] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Evertwine Business</h1>
        <p className="text-gray-500">Loading your business portal...</p>
      </div>
    </div>
  )
}
