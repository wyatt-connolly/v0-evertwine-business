import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase-admin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log("🎯 Stripe webhook received at /api/stripe-webhook")

  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")!

    if (!signature) {
      console.error("❌ No Stripe signature found in headers")
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    if (!webhookSecret) {
      console.error("❌ STRIPE_WEBHOOK_SECRET environment variable not set")
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

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
    console.log(`🕐 Event created: ${new Date(event.created * 1000).toISOString()}`)

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`💳 Checkout session completed: ${session.id}`)
        await handleCheckoutCompleted(session)
        break

      case "customer.subscription.created":
        const createdSubscription = event.data.object as Stripe.Subscription
        console.log(`🆕 Subscription created: ${createdSubscription.id}`)
        await handleSubscriptionCreated(createdSubscription)
        break

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription
        console.log(`🔄 Subscription updated: ${updatedSubscription.id}`)
        await handleSubscriptionUpdated(updatedSubscription)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        console.log(`🗑️ Subscription deleted: ${deletedSubscription.id}`)
        await handleSubscriptionDeleted(deletedSubscription)
        break

      case "invoice.payment_succeeded":
        const successfulInvoice = event.data.object as Stripe.Invoice
        console.log(`💰 Invoice payment succeeded: ${successfulInvoice.id}`)
        await handlePaymentSucceeded(successfulInvoice)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice
        console.log(`❌ Invoice payment failed: ${failedInvoice.id}`)
        await handlePaymentFailed(failedInvoice)
        break

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`)
        return NextResponse.json({ received: true, message: `Unhandled event type: ${event.type}` })
    }

    console.log(`✅ Webhook processing completed for event: ${event.type}`)
    return NextResponse.json({ received: true, eventType: event.type, eventId: event.id })
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

async function findUserByCustomerOrMetadata(customerId: string, metadata?: any): Promise<string | null> {
  // First try to find user by metadata userId
  if (metadata?.userId) {
    console.log(`🔍 Found userId in metadata: ${metadata.userId}`)
    return metadata.userId
  }

  // Then try to find user by customer ID
  console.log(`🔍 Searching for user by customer ID: ${customerId}`)
  const userQuery = await db.collection("business_users").where("customer_id", "==", customerId).get()

  if (!userQuery.empty) {
    const userId = userQuery.docs[0].id
    console.log(`✅ Found user by customer ID: ${userId}`)
    return userId
  }

  console.error(`❌ No user found for customer ID: ${customerId}`)
  return null
}

async function updateUserSubscription(userId: string, updateData: any) {
  try {
    const userRef = db.collection("business_users").doc(userId)

    // Add timestamp
    updateData.updated_at = new Date().toISOString()

    console.log(`💾 Updating user ${userId} with:`, updateData)

    await userRef.update(updateData)

    // Verify the update
    const updatedDoc = await userRef.get()
    const updatedUserData = updatedDoc.data()

    console.log(`✅ User updated successfully`)
    console.log(
      `🔍 Verification - is_subscribed: ${updatedUserData?.is_subscribed}, subscription_active: ${updatedUserData?.subscription_active}`,
    )

    return updatedUserData
  } catch (error: any) {
    console.error(`❌ Error updating user ${userId}:`, error)
    throw error
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (!customerId) {
      console.error("❌ No customer ID in checkout session")
      return
    }

    const userId = await findUserByCustomerOrMetadata(customerId, session.metadata)
    if (!userId) return

    if (subscriptionId) {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      await updateUserSubscription(userId, {
        subscription_status: "active",
        subscription_id: subscriptionId,
        subscription_start: new Date().toISOString(),
        subscription_end: currentPeriodEnd.toISOString(),
        customer_id: customerId,
        is_subscribed: true,
        subscription_active: true,
      })
    } else {
      // One-time payment
      await updateUserSubscription(userId, {
        customer_id: customerId,
        last_payment: new Date().toISOString(),
      })
    }
  } catch (error: any) {
    console.error("❌ Error handling checkout completed:", error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const userId = await findUserByCustomerOrMetadata(customerId, subscription.metadata)
    if (!userId) return

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    await updateUserSubscription(userId, {
      subscription_status: subscription.status,
      subscription_id: subscription.id,
      subscription_start: new Date(subscription.created * 1000).toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: customerId,
      is_subscribed: subscription.status === "active",
      subscription_active: subscription.status === "active",
    })
  } catch (error: any) {
    console.error("❌ Error handling subscription created:", error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const userId = await findUserByCustomerOrMetadata(customerId, subscription.metadata)
    if (!userId) return

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
    const isActive = subscription.status === "active"

    await updateUserSubscription(userId, {
      subscription_status: subscription.status,
      subscription_end: currentPeriodEnd.toISOString(),
      is_subscribed: isActive,
      subscription_active: isActive,
    })
  } catch (error: any) {
    console.error("❌ Error handling subscription updated:", error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const userId = await findUserByCustomerOrMetadata(customerId, subscription.metadata)
    if (!userId) return

    await updateUserSubscription(userId, {
      subscription_status: "canceled",
      subscription_end: new Date().toISOString(),
      is_subscribed: false,
      subscription_active: false,
    })
  } catch (error: any) {
    console.error("❌ Error handling subscription deleted:", error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) {
      console.log("ℹ️ Payment succeeded for non-subscription invoice")
      return
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = await findUserByCustomerOrMetadata(customerId, subscription.metadata)
    if (!userId) return

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    await updateUserSubscription(userId, {
      subscription_status: "active",
      subscription_end: currentPeriodEnd.toISOString(),
      is_subscribed: true,
      subscription_active: true,
      last_payment: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Error handling payment succeeded:", error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string
    const subscriptionId = invoice.subscription as string

    if (!subscriptionId) {
      console.log("ℹ️ Payment failed for non-subscription invoice")
      return
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const userId = await findUserByCustomerOrMetadata(customerId, subscription.metadata)
    if (!userId) return

    await updateUserSubscription(userId, {
      subscription_status: "past_due",
      is_subscribed: false,
      subscription_active: false,
    })
  } catch (error: any) {
    console.error("❌ Error handling payment failed:", error)
  }
}
