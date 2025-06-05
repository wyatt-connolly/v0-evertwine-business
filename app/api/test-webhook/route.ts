import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { eventType, customerId, userId } = await request.json()

    if (!eventType || !customerId) {
      return NextResponse.json({ error: "eventType and customerId are required" }, { status: 400 })
    }

    console.log(`🧪 Testing webhook event: ${eventType} for customer: ${customerId}`)

    // Get customer from Stripe
    const customer = await stripe.customers.retrieve(customerId)
    if (!customer || customer.deleted) {
      return NextResponse.json({ error: "Customer not found in Stripe" }, { status: 404 })
    }

    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    console.log(`📊 Found ${subscriptions.data.length} subscriptions for customer`)

    // Find user in Firebase by customer ID or user ID
    let userDoc
    let userRef
    let userDocId

    if (userId) {
      // Direct user ID lookup
      userRef = db.collection("business_users").doc(userId)
      userDoc = await userRef.get()
      userDocId = userId
    } else {
      // Search by customer ID
      const userQuery = await db.collection("business_users").where("customer_id", "==", customerId).get()

      if (userQuery.empty) {
        return NextResponse.json(
          {
            error: "No user found with this customer ID",
            suggestion: "You may need to update the user's customer_id field first",
          },
          { status: 404 },
        )
      }

      userDoc = userQuery.docs[0]
      userRef = userDoc.ref
      userDocId = userDoc.id
    }

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found in Firebase" }, { status: 404 })
    }

    const userData = userDoc.data()
    console.log(`👤 Found user: ${userData.email}`)

    // Simulate different webhook events
    let updateData = {}
    let eventDescription = ""

    switch (eventType) {
      case "checkout.session.completed":
      case "invoice.payment_succeeded":
        if (subscriptions.data.length > 0) {
          const activeSubscription = subscriptions.data.find((sub) => sub.status === "active")
          if (activeSubscription) {
            const currentPeriodEnd = new Date(activeSubscription.current_period_end * 1000)
            updateData = {
              subscription_status: "active",
              subscription_id: activeSubscription.id,
              subscription_start: new Date().toISOString(),
              subscription_end: currentPeriodEnd.toISOString(),
              customer_id: customerId,
              is_subscribed: true,
              subscription_active: true,
              updated_at: new Date().toISOString(),
            }
            eventDescription = "Successful payment - subscription activated"
          }
        }
        break

      case "invoice.payment_failed":
        updateData = {
          subscription_status: "past_due",
          is_subscribed: false,
          subscription_active: false,
          updated_at: new Date().toISOString(),
        }
        eventDescription = "Payment failed - subscription past due"
        break

      case "customer.subscription.deleted":
        updateData = {
          subscription_status: "canceled",
          subscription_end: new Date().toISOString(),
          is_subscribed: false,
          subscription_active: false,
          updated_at: new Date().toISOString(),
        }
        eventDescription = "Subscription canceled"
        break

      default:
        return NextResponse.json({ error: "Unsupported event type" }, { status: 400 })
    }

    // Update Firebase
    console.log(`💾 Updating Firebase with:`, updateData)
    await userRef.update(updateData)

    // Verify the update
    const updatedDoc = await userRef.get()
    const updatedData = updatedDoc.data()

    return NextResponse.json({
      success: true,
      message: `Webhook simulation completed: ${eventDescription}`,
      userId: userDocId,
      customerId: customerId,
      eventType: eventType,
      updateData: updateData,
      verificationData: {
        is_subscribed: updatedData.is_subscribed,
        subscription_active: updatedData.subscription_active,
        subscription_status: updatedData.subscription_status,
        subscription_end: updatedData.subscription_end,
      },
      stripeData: {
        customerEmail: customer.email,
        subscriptionCount: subscriptions.data.length,
        activeSubscriptions: subscriptions.data.filter((sub) => sub.status === "active").length,
      },
    })
  } catch (error: any) {
    console.error("❌ Error in webhook test:", error)
    return NextResponse.json(
      {
        error: "Webhook test failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
