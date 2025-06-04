import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulPayment(session)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice
        await handleSuccessfulPayment(invoice)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice
        await handleFailedPayment(failedInvoice)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleCanceledSubscription(deletedSubscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleSuccessfulPayment(sessionOrInvoice: Stripe.Checkout.Session | Stripe.Invoice) {
  try {
    let userId: string
    let subscriptionId: string

    if ("metadata" in sessionOrInvoice && sessionOrInvoice.metadata?.userId) {
      userId = sessionOrInvoice.metadata.userId
      subscriptionId = sessionOrInvoice.subscription as string
    } else if ("subscription_details" in sessionOrInvoice && sessionOrInvoice.subscription_details?.metadata?.userId) {
      userId = sessionOrInvoice.subscription_details.metadata.userId
      subscriptionId = sessionOrInvoice.subscription as string
    } else {
      console.error("No userId found in session/invoice metadata")
      return
    }

    console.log(`🎯 Processing successful payment for user: ${userId}, subscription: ${subscriptionId}`)

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Determine plan based on Stripe price/product
    let plan = "premium" // Default to premium for paid subscriptions

    // You can customize this based on your Stripe price IDs
    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      // Map your Stripe price IDs to plan names
      switch (priceId) {
        case "price_basic_monthly":
        case "price_basic_yearly":
          plan = "basic"
          break
        case "price_premium_monthly":
        case "price_premium_yearly":
          plan = "premium"
          break
        case "price_business_monthly":
        case "price_business_yearly":
          plan = "business"
          break
        default:
          plan = "premium" // Default fallback
      }
    }

    console.log(`📅 Subscription period end: ${currentPeriodEnd.toISOString()}`)
    console.log(`📋 Plan determined: ${plan}`)

    // Update user in Firestore
    const userRef = doc(db, "business_users", userId)
    const updateData = {
      subscription_status: "active",
      subscription_id: subscriptionId,
      subscription_start: new Date().toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      plan: plan, // Set the plan field
      updated_at: new Date().toISOString(),
      // Add boolean fields for better performance
      is_subscribed: true,
      subscription_active: true,
      // Update promotion limits based on plan
      promotions_limit: plan === "free" ? 2 : 999, // Unlimited for paid plans
    }

    console.log(`💾 Updating user document with:`, updateData)

    await updateDoc(userRef, updateData)

    console.log(`✅ Successfully updated subscription for user ${userId}`)
  } catch (error) {
    console.error("❌ Error handling successful payment:", error)
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("No userId found in subscription metadata")
      return
    }

    // Update user subscription status but keep plan (they might pay later)
    const userRef = doc(db, "business_users", userId)
    await updateDoc(userRef, {
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
      // Don't change plan immediately - give them time to pay
      is_subscribed: false,
      subscription_active: false,
    })

    console.log(`Updated subscription status to past_due for user ${userId}`)
  } catch (error) {
    console.error("Error handling failed payment:", error)
  }
}

async function handleCanceledSubscription(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("No userId found in subscription metadata")
      return
    }

    // Update user subscription status and revert to free plan
    const userRef = doc(db, "business_users", userId)
    await updateDoc(userRef, {
      subscription_status: "canceled",
      subscription_end: new Date().toISOString(),
      plan: "free", // Revert to free plan
      updated_at: new Date().toISOString(),
      // Add boolean fields
      is_subscribed: false,
      subscription_active: false,
      // Reset promotion limits
      promotions_limit: 2,
    })

    console.log(`Updated subscription status to canceled for user ${userId}`)
  } catch (error) {
    console.error("Error handling canceled subscription:", error)
  }
}
