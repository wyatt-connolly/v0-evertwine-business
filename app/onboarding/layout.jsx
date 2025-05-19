"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth-utils"
import { Loader2 } from "lucide-react"
import FirebaseError from "@/components/firebase-error"

export default function OnboardingLayout({ children }) {
  const { user, userProfile, loading, firebaseInitialized } = useAuthState()
  const router = useRouter()

  useEffect(() => {
    if (!loading && firebaseInitialized) {
      if (!user) {
        router.push("/login")
      } else if (userProfile?.onboardingComplete) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router, userProfile, firebaseInitialized])

  // If Firebase is not initialized, show the error component
  if (!firebaseInitialized) {
    return <FirebaseError />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evertwine Business Onboarding</h1>
          <p className="mt-2 text-gray-600">Complete your business profile to get started</p>
        </div>
        {children}
      </div>
    </div>
  )
}
