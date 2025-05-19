"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useAuthState } from "@/lib/auth-utils"
import FirebaseError from "@/components/firebase-error"

export default function ThankYouPage() {
  const router = useRouter()
  const { firebaseInitialized } = useAuthState()

  // If Firebase is not initialized, show the error component
  if (!firebaseInitialized) {
    return <FirebaseError />
  }

  return (
    <Card className="shadow-lg rounded-2xl text-center">
      <CardHeader className="pb-4">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Thank you for applying!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg">We&apos;ve received your application and will contact you within 3–5 business days.</p>
        <p className="text-gray-500">Keep an eye on your inbox for updates about your application status.</p>
      </CardContent>
      <CardFooter className="flex justify-center pt-4">
        <Button onClick={() => router.push("/dashboard")} className="bg-[#6A0DAD] hover:bg-[#5a0b93]">
          Return to dashboard
        </Button>
      </CardFooter>
    </Card>
  )
}
