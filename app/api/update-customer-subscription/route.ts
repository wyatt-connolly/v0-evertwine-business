import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, customerId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    console.log(`🔍 Looking up customer: ${customerId}`)

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(customerId)

    if (!customer || customer.deleted) {
      return NextResponse.json({ error: "Customer not found or deleted" }, { status: 404 })
    }

    console.log(`✅ Found customer: ${customer.id}`)

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
    })

    const userRef = db.collection("business_users").doc(userId)
    const userData = {
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    }

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      const isActive = subscription.status === "active"

      Object.assign(userData, {
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_end: currentPeriodEnd.toISOString(),
        subscription_start: new Date(subscription.start_date * 1000).toISOString(),
        is_subscribed: isActive,
        subscription_active: isActive,
      })

      console.log(`📊 Found subscription: ${subscription.id}, status: ${subscription.status}`)
    } else {
      console.log(`⚠️ No subscriptions found for customer: ${customerId}`)
      Object.assign(userData, {
        is_subscribed: false,
        subscription_active: false,
        subscription_status: "none",
      })
    }

    // Update user in Firebase
    await userRef.update(userData)

    // Verify the update
    const updatedDoc = await userRef.get()
    const updatedUserData = updatedDoc.data()

    return NextResponse.json({
      success: true,
      message: "User subscription updated successfully",
      userData: {
        customer_id: updatedUserData?.customer_id,
        subscription_id: updatedUserData?.subscription_id,
        subscription_status: updatedUserData?.subscription_status,
        is_subscribed: updatedUserData?.is_subscribed,
        subscription_active: updatedUserData?.subscription_active,
      },
    })
  } catch (error: any) {
    console.error("Error updating customer subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to update customer subscription",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
