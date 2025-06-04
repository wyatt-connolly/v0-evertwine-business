import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    // Get user document
    const userDoc = await getDoc(doc(db, "business_users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const customerId = userData.customer_id

    if (!customerId) {
      return NextResponse.json({ error: "No customer ID found" }, { status: 400 })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // No active subscription
      await updateDoc(doc(db, "business_users", userId), {
        is_subscribed: false,
        subscription_active: false,
        subscription_status: "inactive",
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "No active subscription found",
        status: "inactive",
        is_subscribed: false,
      })
    }

    const subscription = subscriptions.data[0]
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    const isActive = subscription.status === "active"

    // Update user document with simple boolean
    await updateDoc(doc(db, "business_users", userId), {
      is_subscribed: isActive,
      subscription_active: isActive,
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      is_subscribed: isActive,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: currentPeriodEnd.toISOString(),
      },
    })
  } catch (error: any) {
    console.error("Error syncing subscription:", error)
    return NextResponse.json({ error: "Failed to sync subscription", details: error.message }, { status: 500 })
  }
}
