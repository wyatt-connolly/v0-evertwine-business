"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Check, X, CreditCard, Users, BarChart3, Sparkles, Crown, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

declare global {
  interface Window {
    Stripe: any
  }
}

export default function BillingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionEnd, setSubscriptionEnd] = useState<Date | null>(null)
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [stripe, setStripe] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const canceled = searchParams.get("canceled")

  useEffect(() => {
    if (canceled) {
      toast({
        variant: "destructive",
        title: "Payment Canceled",
        description: "Your subscription setup was canceled. You can try again anytime.",
      })
    }
  }, [canceled, toast])

  useEffect(() => {
    // Load Stripe
    const loadStripe = async () => {
      try {
        const response = await fetch("/api/config")
        const config = await response.json()

        if (!config.stripePublishableKey) {
          console.error("Stripe publishable key not found")
          return
        }

        const script = document.createElement("script")
        script.src = "https://js.stripe.com/v3/"
        script.onload = () => {
          const stripeInstance = window.Stripe(config.stripePublishableKey)
          setStripe(stripeInstance)
          setStripeLoaded(true)
        }
        document.head.appendChild(script)

        return () => {
          document.head.removeChild(script)
        }
      } catch (error) {
        console.error("Error loading Stripe:", error)
      }
    }

    loadStripe()
  }, [])

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, "business_users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setSubscriptionStatus(userData.subscription_status || null)
          if (userData.subscription_end) {
            setSubscriptionEnd(new Date(userData.subscription_end))
          }
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [user])

  const handleSubscribe = async () => {
    if (!stripeLoaded || !user || !stripe) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Payment system not ready. Please try again.",
      })
      return
    }

    setSubscribing(true)

    try {
      // Create checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      })

      const { sessionId } = await response.json()

      if (!sessionId) {
        throw new Error("Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error("Error creating subscription:", error)
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to start subscription process. Please try again.",
      })
    } finally {
      setSubscribing(false)
    }
  }

  const isActive = subscriptionStatus === "active" && subscriptionEnd && subscriptionEnd > new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6A0DAD]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">Unlock the full potential of your business with Evertwine Pro</p>
      </div>

      {/* Current Status Alert */}
      {isActive && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Active Subscription:</strong> Your Pro plan is active until{" "}
            {subscriptionEnd?.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className="relative border-2">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">Free Plan</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <X className="h-5 w-5 text-red-500" />
                <span>No promotions allowed</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="h-5 w-5 text-red-500" />
                <span>No analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Basic profile setup</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>QR code generation</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border-2 border-[#6A0DAD] shadow-lg">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-[#6A0DAD] to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Most Popular
            </div>
          </div>
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-[#6A0DAD]" />
              Pro Plan
            </CardTitle>
            <CardDescription>Everything you need to grow your business</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">$25</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">Unlimited promotions</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Advanced analytics & insights</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>QR code tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Multiple promotion images</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Location-based targeting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <span>Custom business branding</span>
              </div>
            </div>
            <Button
              onClick={handleSubscribe}
              className="w-full mt-6 bg-gradient-to-r from-[#6A0DAD] to-purple-600 hover:from-[#5a0b93] hover:to-purple-700 text-white shadow-lg"
              disabled={subscribing || isActive}
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : isActive ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Active Plan
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Start Pro Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Showcase */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold mb-2">Instant Promotion Creation</h3>
          <p className="text-sm text-muted-foreground">
            Create and publish promotions instantly. No waiting for approval.
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold mb-2">Detailed Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Track views, clicks, and conversion rates to optimize your promotions.
          </p>
        </Card>

        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-semibold mb-2">Reach More Customers</h3>
          <p className="text-sm text-muted-foreground">
            Connect with your target audience through QR codes and location targeting.
          </p>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your
              billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-muted-foreground">
              We accept all major credit cards including Visa, Mastercard, and American Express through our secure
              Stripe payment processor.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Is there a setup fee?</h4>
            <p className="text-sm text-muted-foreground">
              No setup fees! Just pay $25/month and start creating promotions immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
