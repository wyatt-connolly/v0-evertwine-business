"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check } from "lucide-react"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

export default function ContactPlanPage() {
  const { user, loading } = useAuthState()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [plan, setPlan] = useState("free")
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
            setEmail(data.email || "")
            setPhone(data.phone || "")

            // Check if user completed step 1
            if (!data.onboardingStep || data.onboardingStep < 1) {
              router.push("/onboarding/business-info")
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

    if (!email || !phone) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsLoading(true)

    try {
      const businessData = {
        email,
        phone,
        plan,
        promotionsLimit: plan === "premium" ? 5 : 2,
        onboardingStep: 2,
      }

      await updateDoc(doc(db, "businesses", user.uid), businessData)

      toast({
        title: "Contact and plan information saved",
        description: "Let's continue with the final step.",
      })

      router.push("/onboarding/payment")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save information",
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
        <CardTitle className="text-xl">Step 2: Contact & Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <PhoneInput
              country={"us"}
              value={phone}
              onChange={(phone) => setPhone(phone)}
              inputStyle={{
                width: "100%",
                height: "40px",
                fontSize: "16px",
                borderRadius: "0.375rem",
                border: "1px solid #e2e8f0",
              }}
              containerStyle={{
                marginBottom: "0",
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Select a Plan</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Card
                className={`cursor-pointer border-2 ${plan === "free" ? "border-[#6A0DAD]" : "border-gray-200"}`}
                onClick={() => setPlan("free")}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Free</CardTitle>
                    {plan === "free" && (
                      <div className="bg-[#6A0DAD] text-white p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>2 live promotions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Standard commission</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Basic support</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-center font-bold">$0 / month</div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${plan === "premium" ? "border-[#6A0DAD]" : "border-gray-200"}`}
                onClick={() => setPlan("premium")}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Premium</CardTitle>
                    {plan === "premium" && (
                      <div className="bg-[#6A0DAD] text-white p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>5 live promotions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Lower commission</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span>Priority review & support</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-center font-bold">$25 / month</div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">Applications are reviewed in 3–5 business days.</p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-6">
        <Button variant="outline" onClick={() => router.push("/onboarding/business-info")}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">Step 2 of 3</div>
          <Button onClick={handleSubmit} className="bg-[#6A0DAD] hover:bg-[#5a0b93]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
