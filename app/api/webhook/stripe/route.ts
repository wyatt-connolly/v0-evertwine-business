import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-admin"

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

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulPayment(session)
        break

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice
        await handleSuccessfulPayment(invoice)
        break

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice
        await handleFailedPayment(failedInvoice)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleCanceledSubscription(deletedSubscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
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
      console.error("No userId found in session/invoice metadata")
      return
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    // Update user in Firestore
    const userRef = doc(db, "business_users", userId)
    await updateDoc(userRef, {
      subscription_status: "active",
      subscription_id: subscriptionId,
      subscription_start: new Date().toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      customer_id: subscription.customer,
      updated_at: new Date().toISOString(),
    })

    console.log(`Successfully updated subscription for user ${userId}`)
  } catch (error) {
    console.error("Error handling successful payment:", error)
  }
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("No userId found in subscription metadata")
      return
    }

    // Update user subscription status
    const userRef = doc(db, "business_users", userId)
    await updateDoc(userRef, {
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })

    console.log(`Updated subscription status to past_due for user ${userId}`)
  } catch (error) {
    console.error("Error handling failed payment:", error)
  }
}

async function handleCanceledSubscription(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId

    if (!userId) {
      console.error("No userId found in subscription metadata")
      return
    }

    // Update user subscription status
    const userRef = doc(db, "business_users", userId)
    await updateDoc(userRef, {
      subscription_status: "canceled",
      subscription_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    console.log(`Updated subscription status to canceled for user ${userId}`)
  } catch (error) {
    console.error("Error handling canceled subscription:", error)
  }
}
