"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, Check } from "lucide-react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function PaymentPage() {
  const { user, loading } = useAuthState()
  const [plan, setPlan] = useState("free")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "businesses", user.uid)
          const docSnap = await getDoc(docRef)

          if (docSnap.exists()) {
            const data = docSnap.data()
            setPlan(data.plan || "free")

            // Check if user completed step 2
            if (!data.onboardingStep || data.onboardingStep < 2) {
              router.push("/onboarding/contact-plan")
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        } finally {
          setIsLoadingData(false)
        }
      }
    }

    if (user) {
      fetchUserData()
    } else if (!loading) {
      setIsLoadingData(false)
    }
  }, [user, loading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to complete this step.",
      })
      return
    }

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Terms not accepted",
        description: "Please accept the terms to continue.",
      })
      return
    }

    setIsLoading(true)

    try {
      const businessData = {
        termsAccepted: true,
        onboardingComplete: true,
        onboardingStep: 3,
        applicationDate: new Date().toISOString(),
        status: "pending",
      }

      await updateDoc(doc(db, "businesses", user.uid), businessData)

      toast({
        title: "Application submitted successfully",
        description: "We'll review your application and get back to you soon.",
      })

      router.push("/onboarding/thank-you")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit application",
        description: error.message || "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Card className="shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Step 3: Payment & Confirmation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {plan === "premium" ? (
            <>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Payment Method</h3>
                    <p className="text-sm text-gray-500">Add a payment method to continue</p>
                  </div>
                  <Button variant="outline" className="ml-auto" type="button">
                    Add Payment Method
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Billing Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Premium Plan</span>
                    <span>$25.00/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing Cycle</span>
                    <span>Monthly</span>
                  </div>
                  <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                    <span>Total</span>
                    <span>$25.00/month</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Plan Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Free Plan - $0/month</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>2 live promotions</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Standard commission</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked)} />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to Evertwine&apos;s policies and understand we&apos;re not liable for in-meetup incidents.
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this box, you agree to our{" "}
                <a href="#" className="text-[#6A0DAD] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#6A0DAD] hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <Button variant="outline" onClick={() => router.push("/onboarding/contact-plan")}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Step 3 of 3</div>
          <Button
            onClick={handleSubmit}
            className="bg-[#6A0DAD] hover:bg-[#5a0b93]"
            disabled={isLoading || !termsAccepted}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
