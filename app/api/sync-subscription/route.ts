import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    console.log(`🔄 Syncing subscription for user: ${userId}`)

    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    // Get user document
    const userRef = db.collection("business_users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const customerId = userData.customer_id

    if (!customerId) {
      return NextResponse.json({ error: "No customer ID found" }, { status: 400 })
    }

    console.log(`🔍 Looking up Stripe customer: ${customerId}`)

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all", // Get all statuses to see what's there
      limit: 10,
    })

    console.log(`📊 Found ${subscriptions.data.length} subscriptions`)

    if (subscriptions.data.length === 0) {
      // No subscriptions found
      await userRef.update({
        subscription_status: "inactive",
        plan: "free",
        updated_at: new Date().toISOString(),
        is_subscribed: false,
        subscription_active: false,
        promotions_limit: 2,
      })

      return NextResponse.json({
        success: true,
        message: "No subscriptions found - reverted to free plan",
        status: "inactive",
      })
    }

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find((sub) => sub.status === "active" || sub.status === "trialing")

    if (!activeSubscription) {
      // No active subscription, but subscriptions exist
      const latestSubscription = subscriptions.data[0]

      await userRef.update({
        subscription_status: latestSubscription.status,
        plan: "free",
        updated_at: new Date().toISOString(),
        is_subscribed: false,
        subscription_active: false,
        promotions_limit: 2,
      })

      return NextResponse.json({
        success: true,
        message: `No active subscription found. Latest status: ${latestSubscription.status}`,
        status: latestSubscription.status,
        subscriptions: subscriptions.data.map((sub) => ({
          id: sub.id,
          status: sub.status,
          created: new Date(sub.created * 1000).toISOString(),
        })),
      })
    }

    // We have an active subscription!
    const subscription = activeSubscription
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Determine plan
    let plan = "premium" // Default for paid subscriptions
    const promotionsLimit = 999

    if (subscription.items.data.length > 0) {
      const priceId = subscription.items.data[0].price.id
      const productId = subscription.items.data[0].price.product as string

      console.log(`💰 Price ID: ${priceId}`)
      console.log(`📦 Product ID: ${productId}`)

      // You can customize this based on your actual Stripe setup
      if (priceId.includes("basic") || productId.includes("basic")) {
        plan = "basic"
      } else if (priceId.includes("business") || productId.includes("business")) {
        plan = "business"
      } else {
        plan = "premium"
      }
    }

    // Update user document
    const updateData = {
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      plan: plan,
      updated_at: new Date().toISOString(),
      is_subscribed: true,
      subscription_active: true,
      promotions_limit: promotionsLimit,
    }

    console.log(`💾 Updating with:`, updateData)

    await userRef.update(updateData)

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: plan,
        current_period_end: currentPeriodEnd.toISOString(),
        price_id: subscription.items.data[0]?.price.id,
        product_id: subscription.items.data[0]?.price.product,
      },
      allSubscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
      })),
    })
  } catch (error: any) {
    console.error("❌ Error syncing subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to sync subscription",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
