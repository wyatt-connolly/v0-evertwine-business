import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, customerId } = await request.json()

    if (!userId || !customerId) {
      return NextResponse.json({ error: "userId and customerId are required" }, { status: 400 })
    }

    console.log(`🔄 Updating customer ID for user ${userId} to ${customerId}`)

    // First, check if the customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(customerId)
      if (!customer || customer.deleted) {
        return NextResponse.json({ error: "Invalid Stripe customer ID" }, { status: 400 })
      }
      console.log(`✅ Verified Stripe customer: ${customer.email}`)
    } catch (error: any) {
      console.error("❌ Error verifying Stripe customer:", error)
      return NextResponse.json({ error: `Invalid Stripe customer ID: ${error.message}` }, { status: 400 })
    }

    // Get user document reference
    const userRef = db.collection("business_users").doc(userId)

    // Check if user exists
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update the customer ID
    await userRef.update({
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    })

    console.log(`✅ Updated customer ID in Firebase`)

    // Now get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // No active subscription
      await userRef.update({
        subscription_status: "inactive",
        is_subscribed: false,
        subscription_active: false,
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "Customer ID updated, but no active subscription found",
        status: "inactive",
      })
    }

    const subscription = subscriptions.data[0]
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Update user document with subscription details
    await userRef.update({
      subscription_status: "active",
      subscription_id: subscription.id,
      subscription_end: currentPeriodEnd.toISOString(),
      is_subscribed: true,
      subscription_active: true,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Customer ID and subscription synced successfully",
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: currentPeriodEnd.toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error updating customer ID:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer ID",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
