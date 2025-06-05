import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe only when needed to avoid build-time errors
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set")
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  })
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // List existing webhooks
    const existingWebhooks = await stripe.webhookEndpoints.list()

    // Check if webhook already exists
    const existingWebhook = existingWebhooks.data.find((webhook) => webhook.url === url)

    if (existingWebhook) {
      return NextResponse.json({
        message: "Webhook already exists",
        webhook: existingWebhook,
        secret: "Use existing webhook secret from Stripe dashboard",
      })
    }

    // Create new webhook
    const webhook = await stripe.webhookEndpoints.create({
      url: url,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
      ],
    })

    return NextResponse.json({
      message: "Webhook created successfully",
      webhook: {
        id: webhook.id,
        url: webhook.url,
        status: webhook.status,
        enabled_events: webhook.enabled_events,
      },
      secret: webhook.secret,
      instructions: [
        "1. Copy the webhook secret above",
        "2. Add it to your environment variables as STRIPE_WEBHOOK_SECRET",
        "3. Redeploy your application",
        "4. Test the webhook using the test endpoint",
      ],
    })
  } catch (error: any) {
    console.error("Error configuring webhook:", error)
    return NextResponse.json(
      {
        error: "Failed to configure webhook",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const stripe = getStripe()

    // List all webhooks
    const webhooks = await stripe.webhookEndpoints.list()

    return NextResponse.json({
      webhooks: webhooks.data.map((webhook) => ({
        id: webhook.id,
        url: webhook.url,
        status: webhook.status,
        enabled_events: webhook.enabled_events,
        created: new Date(webhook.created * 1000).toISOString(),
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to list webhooks",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
