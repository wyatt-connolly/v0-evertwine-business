import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-admin"
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

    console.log(`🔧 Fixing subscription for user: ${userId}`)

    // Get user document
    const userDoc = await getDoc(doc(db, "business_users", userId))

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const customerId = userData.customer_id

    if (!customerId) {
      return NextResponse.json(
        {
          error: "No Stripe customer ID found",
          suggestion: "User needs to complete subscription process",
        },
        { status: 400 },
      )
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })

    const activeSubscription = subscriptions.data[0]

    if (!activeSubscription) {
      // No active subscription - mark as inactive
      await updateDoc(doc(db, "business_users", userId), {
        subscription_status: "canceled",
        subscription_active: false,
        is_subscribed: false,
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        message: "No active subscription found - marked as inactive",
        subscription: null,
      })
    }

    // Active subscription found - update Firebase
    const currentPeriodEnd = new Date(activeSubscription.current_period_end * 1000)

    await updateDoc(doc(db, "business_users", userId), {
      subscription_status: "active",
      subscription_active: true,
      is_subscribed: true,
      subscription_id: activeSubscription.id,
      subscription_end: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log(`✅ Fixed subscription for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Subscription status updated successfully",
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        current_period_end: currentPeriodEnd.toISOString(),
        customer: activeSubscription.customer,
      },
    })
  } catch (error) {
    console.error("❌ Error fixing subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to fix subscription",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
