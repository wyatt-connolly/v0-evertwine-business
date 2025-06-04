import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

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

    console.log(`🎯 Received webhook event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        console.log("📋 Checkout session completed:", session.id)
        await handleSuccessfulPayment(session)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice
        console.log("💰 Invoice payment succeeded:", invoice.id)
        await handleSuccessfulPayment(invoice)
        break

      case "customer.subscription.created":
        const createdSubscription = event.data.object as Stripe.Subscription
        console.log("🆕 Subscription created:", createdSubscription.id)
        await handleSubscriptionChange(createdSubscription)
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log("🔄 Subscription updated:", updatedSubscription.id)
        await handleSubscriptionChange(updatedSubscription)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log("❌ Invoice payment failed:", failedInvoice.id)
        await handleFailedPayment(failedInvoice)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log("🗑️ Subscription deleted:", deletedSubscription.id)
        await handleCanceledSubscription(deletedSubscription)
        break

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("❌ No userId found in subscription metadata")
      return
    }

    console.log(`🎯 Processing subscription change for user: ${userId}`)

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Determine plan based on subscription status and items
    let plan = "free"
    let promotionsLimit = 2

    if (subscription.status === "active" || subscription.status === "trialing") {
      // Default to premium for any active paid subscription
      plan = "premium"
      promotionsLimit = 999 // Unlimited

      // You can customize this based on your actual Stripe price IDs
      if (subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id
        const productId = subscription.items.data[0].price.product as string

        console.log(`💰 Price ID: ${priceId}, Product ID: ${productId}`)

        // Map your actual Stripe price IDs to plan names
        // You'll need to replace these with your actual price IDs from Stripe
        if (priceId.includes("basic") || productId.includes("basic")) {
          plan = "basic"
        } else if (priceId.includes("business") || productId.includes("business")) {
          plan = "business"
        } else {
          plan = "premium" // Default for paid subscriptions
        }
      }
    }

    console.log(`📋 Plan determined: ${plan}`)
    console.log(`📊 Promotions limit: ${promotionsLimit}`)

    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    // Update user in Firestore using Admin SDK
    const userRef = db.collection("business_users").doc(userId)
    const updateData = {
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_start: new Date(subscription.created * 1000).toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      plan: plan,
      updated_at: new Date().toISOString(),
      // Add boolean fields for better performance
      is_subscribed: subscription.status === "active" || subscription.status === "trialing",
      subscription_active: subscription.status === "active" || subscription.status === "trialing",
      // Update promotion limits based on plan
      promotions_limit: promotionsLimit,
    }

    console.log(`💾 Updating user document with:`, JSON.stringify(updateData, null, 2))

    await userRef.update(updateData)

    console.log(`✅ Successfully updated subscription for user ${userId}`)
  } catch (error) {
    console.error("❌ Error handling subscription change:", error)
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
      console.error("❌ No userId found in session/invoice metadata")
      return
    }

    if (!subscriptionId) {
      console.error("❌ No subscription ID found")
      return
    }

    console.log(`🎯 Processing successful payment for user: ${userId}, subscription: ${subscriptionId}`)

    // Get the full subscription details and handle it
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    await handleSubscriptionChange(subscription)
  } catch (error) {
    console.error("❌ Error handling successful payment:", error)
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("❌ No userId found in subscription metadata")
      return
    }

    console.log(`⚠️ Processing failed payment for user: ${userId}`)

    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    // Update user subscription status but keep plan (they might pay later)
    const userRef = db.collection("business_users").doc(userId)
    await userRef.update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
      // Don't change plan immediately - give them time to pay
      is_subscribed: false,
      subscription_active: false,
    })

    console.log(`⚠️ Updated subscription status to past_due for user ${userId}`)
  } catch (error) {
    console.error("❌ Error handling failed payment:", error)
  }
}

async function handleCanceledSubscription(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("❌ No userId found in subscription metadata")
      return
    }

    console.log(`🗑️ Processing canceled subscription for user: ${userId}`)

    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    // Update user subscription status and revert to free plan
    const userRef = db.collection("business_users").doc(userId)
    await userRef.update({
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

    console.log(`🗑️ Updated subscription status to canceled for user ${userId}`)
  } catch (error) {
    console.error("❌ Error handling canceled subscription:", error)
  }
}
