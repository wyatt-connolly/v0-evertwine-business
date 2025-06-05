import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log("🎯 Webhook received")

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ Webhook signature verified for event: ${event.type}`)
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`📨 Processing webhook event: ${event.type}`)
    console.log(`📊 Event ID: ${event.id}`)

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`💳 Checkout session completed: ${session.id}`)
        await handleSuccessfulPayment(session)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice
        console.log(`💰 Invoice payment succeeded: ${invoice.id}`)
        await handleSuccessfulPayment(invoice)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log(`❌ Invoice payment failed: ${failedInvoice.id}`)
        await handleFailedPayment(failedInvoice)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log(`🗑️ Subscription deleted: ${deletedSubscription.id}`)
        await handleCanceledSubscription(deletedSubscription)
        break

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
    }

    console.log(`✅ Webhook processing completed for event: ${event.type}`)
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

async function handleSuccessfulPayment(sessionOrInvoice: Stripe.Checkout.Session | Stripe.Invoice) {
  try {
    let userId: string | null = null
    let subscriptionId: string | null = null
    let customerId: string | null = null

    // Extract data from session or invoice
    if ("metadata" in sessionOrInvoice && sessionOrInvoice.metadata?.userId) {
      userId = sessionOrInvoice.metadata.userId
      subscriptionId = sessionOrInvoice.subscription as string
      customerId = sessionOrInvoice.customer as string
    } else if ("subscription_details" in sessionOrInvoice && sessionOrInvoice.subscription_details?.metadata?.userId) {
      userId = sessionOrInvoice.subscription_details.metadata.userId
      subscriptionId = sessionOrInvoice.subscription as string
      customerId = sessionOrInvoice.customer as string
    } else if ("customer" in sessionOrInvoice) {
      // Try to find user by customer ID
      customerId = sessionOrInvoice.customer as string
      subscriptionId = sessionOrInvoice.subscription as string

      console.log(`🔍 No userId in metadata, searching by customer ID: ${customerId}`)

      const userQuery = await db.collection("business_users").where("customer_id", "==", customerId).get()

      if (!userQuery.empty) {
        userId = userQuery.docs[0].id
        console.log(`✅ Found user by customer ID: ${userId}`)
      }
    }

    if (!userId) {
      console.error("❌ No userId found in session/invoice metadata or by customer lookup")
      console.log("📊 Available data:", {
        hasMetadata: "metadata" in sessionOrInvoice,
        metadata: "metadata" in sessionOrInvoice ? sessionOrInvoice.metadata : null,
        customerId: customerId,
        subscriptionId: subscriptionId,
      })
      return
    }

    if (!subscriptionId) {
      console.error("❌ No subscription ID found")
      return
    }

    console.log(
      `🎯 Processing successful payment for user: ${userId}, subscription: ${subscriptionId}, customer: ${customerId}`,
    )

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    console.log(`📅 Subscription details:`)
    console.log(`   - Status: ${subscription.status}`)
    console.log(`   - Period end: ${currentPeriodEnd.toISOString()}`)
    console.log(`   - Customer: ${subscription.customer}`)

    // Update user in Firestore
    const userRef = db.collection("business_users").doc(userId)
    const updateData = {
      subscription_status: "active",
      subscription_id: subscriptionId,
      subscription_start: new Date().toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      is_subscribed: true,
      subscription_active: true,
      updated_at: new Date().toISOString(),
    }

    console.log(`💾 Updating user document with:`, updateData)

    await userRef.update(updateData)

    // Verify the update
    const updatedDoc = await userRef.get()
    const updatedData = updatedDoc.data()

    console.log(`✅ Successfully updated subscription for user ${userId}`)
    console.log(
      `🔍 Verification - is_subscribed: ${updatedData?.is_subscribed}, subscription_active: ${updatedData?.subscription_active}`,
    )
  } catch (error: any) {
    console.error("❌ Error handling successful payment:", error)
    console.error("🔍 Error details:", error.message)
    console.error("📊 Stack trace:", error.stack)
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    let userId = subscription.metadata?.userId

    // If no userId in metadata, try to find by customer ID
    if (!userId) {
      const customerId = subscription.customer as string
      const userQuery = await db.collection("business_users").where("customer_id", "==", customerId).get()

      if (!userQuery.empty) {
        userId = userQuery.docs[0].id
      }
    }

    if (!userId) {
      console.error("❌ No userId found in subscription metadata or by customer lookup")
      return
    }

    console.log(`⚠️ Processing failed payment for user: ${userId}`)

    // Update user subscription status
    const userRef = db.collection("business_users").doc(userId)
    await userRef.update({
      subscription_status: "past_due",
      is_subscribed: false,
      subscription_active: false,
      updated_at: new Date().toISOString(),
    })

    console.log(`✅ Updated subscription status to past_due for user ${userId}`)
  } catch (error: any) {
    console.error("❌ Error handling failed payment:", error)
  }
}

async function handleCanceledSubscription(subscription: Stripe.Subscription) {
  try {
    let userId = subscription.metadata?.userId

    // If no userId in metadata, try to find by customer ID
    if (!userId) {
      const customerId = subscription.customer as string
      const userQuery = await db.collection("business_users").where("customer_id", "==", customerId).get()

      if (!userQuery.empty) {
        userId = userQuery.docs[0].id
      }
    }

    if (!userId) {
      console.error("❌ No userId found in subscription metadata or by customer lookup")
      return
    }

    console.log(`🗑️ Processing canceled subscription for user: ${userId}`)

    // Update user subscription status
    const userRef = db.collection("business_users").doc(userId)
    await userRef.update({
      subscription_status: "canceled",
      subscription_end: new Date().toISOString(),
      is_subscribed: false,
      subscription_active: false,
      updated_at: new Date().toISOString(),
    })

    console.log(`✅ Updated subscription status to canceled for user ${userId}`)
  } catch (error: any) {
    console.error("❌ Error handling canceled subscription:", error)
  }
}
