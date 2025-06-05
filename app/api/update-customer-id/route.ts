import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, customerId } = await request.json()

    if (!userId || !customerId) {
      return NextResponse.json({ error: "Missing userId or customerId" }, { status: 400 })
    }

    console.log(`🔄 Updating customer ID for user ${userId} to ${customerId}`)

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer || customer.deleted) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 })
    }

    // Get user document
    const userRef = db.collection("business_users").doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user with customer ID
    await userRef.update({
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    })

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    })

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      // Update subscription info
      await userRef.update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_start: new Date(subscription.start_date * 1000).toISOString(),
        subscription_end: currentPeriodEnd.toISOString(),
        is_subscribed: true,
        subscription_active: true,
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "Customer ID and subscription updated",
        customerId,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionEnd: currentPeriodEnd.toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Customer ID updated, no active subscriptions found",
      customerId,
    })
  } catch (error: any) {
    console.error("Error updating customer ID:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer ID",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
