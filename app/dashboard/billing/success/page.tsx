"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function BillingSuccessPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscriptionVerified, setSubscriptionVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  useEffect(() => {
    const verifySubscription = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      try {
        const userDoc = await getDoc(doc(db, "business_users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.subscription_status === "active") {
            setSubscriptionVerified(true)
          }
        }
      } catch (error) {
        console.error("Error verifying subscription:", error)
      } finally {
        setLoading(false)
      }
    }

    verifySubscription()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD] mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader className="pb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl mb-2">Welcome to Evertwine Pro!</CardTitle>
          <CardDescription className="text-lg">
            {subscriptionVerified
              ? "Your subscription is now active and ready to use."
              : "Your payment was successful. Your subscription will be activated shortly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-[#6A0DAD]/10 to-purple-600/10 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-[#6A0DAD]" />
              <h3 className="font-semibold">What's Next?</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Create unlimited promotions for your business</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Track detailed analytics and customer engagement</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Use QR codes to connect with customers</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Access priority customer support</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard/promotions/new")}
              className="bg-gradient-to-r from-[#6A0DAD] to-purple-600 hover:from-[#5a0b93] hover:to-purple-700"
            >
              Create Your First Promotion
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">Session ID: {sessionId}</div>
        </CardContent>
      </Card>
    </div>
  )
}
