"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Loader2,
  Check,
  CreditCard,
  Users,
  BarChart3,
  Sparkles,
  Crown,
  Zap,
  Star,
  TrendingUp,
  Shield,
  Headphones,
} from "lucide-react"
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Unlock Your Business Potential</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Join thousands of businesses using Evertwine Pro to create powerful promotions and grow their customer base
        </p>
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

      {/* Social Proof */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6 rounded-xl border">
        <div className="flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-[#6A0DAD]">10,000+</div>
            <div className="text-sm text-muted-foreground">Active Businesses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#6A0DAD]">500K+</div>
            <div className="text-sm text-muted-foreground">Promotions Created</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#6A0DAD]">98%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Pro Plan - Single Plan */}
      <div className="max-w-md mx-auto">
        <Card className="relative border-2 border-[#6A0DAD] shadow-2xl">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-[#6A0DAD] to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Most Popular Choice
            </div>
          </div>
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-3xl flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-[#6A0DAD]" />
              Evertwine Pro
            </CardTitle>
            <CardDescription className="text-lg">Everything you need to grow your business</CardDescription>
            <div className="mt-6">
              <span className="text-5xl font-bold">$35</span>
              <span className="text-muted-foreground text-xl">/month</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">Cancel anytime • No setup fees</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-medium">Unlimited promotions</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Advanced analytics & customer insights</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>QR code tracking & engagement metrics</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Multiple high-quality promotion images</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Location-based customer targeting</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Custom business branding</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Real-time promotion performance</span>
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              className="w-full mt-8 bg-gradient-to-r from-[#6A0DAD] to-purple-600 hover:from-[#5a0b93] hover:to-purple-700 text-white shadow-lg text-lg py-6"
              disabled={subscribing || isActive}
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up your account...
                </>
              ) : isActive ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Active Subscription
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Start Your Pro Journey
                </>
              )}
            </Button>

            {!isActive && (
              <div className="text-center text-sm text-muted-foreground">🔒 Secure payment powered by Stripe</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Value Proposition */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <Card className="text-center p-6 border-0 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-3">Increase Revenue</h3>
          <p className="text-muted-foreground">
            Businesses see an average 40% increase in customer engagement within the first month
          </p>
        </Card>

        <Card className="text-center p-6 border-0 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-3">Data-Driven Insights</h3>
          <p className="text-muted-foreground">
            Make informed decisions with detailed analytics on customer behavior and promotion performance
          </p>
        </Card>

        <Card className="text-center p-6 border-0 shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-[#6A0DAD] to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-3">Expand Your Reach</h3>
          <p className="text-muted-foreground">
            Connect with new customers through location-based targeting and QR code sharing
          </p>
        </Card>
      </div>

      {/* Testimonial */}
      <Card className="bg-gradient-to-r from-[#6A0DAD]/5 to-purple-600/5 border-[#6A0DAD]/20">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
          </div>
          <blockquote className="text-lg italic mb-4">
            "Evertwine Pro transformed how we connect with customers. Our promotion engagement increased by 60% in just
            two months!"
          </blockquote>
          <cite className="text-muted-foreground">— Sarah Johnson, Local Restaurant Owner</cite>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time with no penalties. You'll continue to have access until the
              end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
            <p className="text-muted-foreground">
              We accept all major credit cards including Visa, Mastercard, and American Express through our secure
              Stripe payment processor.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
            <p className="text-muted-foreground">
              No setup fees or hidden costs! Just $35/month and you can start creating unlimited promotions immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Do you offer customer support?</h4>
            <p className="text-muted-foreground">
              Yes! Pro subscribers get priority customer support via email and chat to help you maximize your promotion
              success.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Bank-level security</span>
        </div>
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" />
          <span>24/7 support</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>Instant activation</span>
        </div>
      </div>
    </div>
  )
}
