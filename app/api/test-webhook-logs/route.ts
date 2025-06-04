import { NextResponse } from "next/server"

// Simple endpoint to help debug webhook processing
export async function GET() {
  return NextResponse.json({
    message: "Check your Vercel deployment logs for webhook events",
    webhookUrl: `${process.env.VERCEL_URL || "your-domain"}/api/webhook/stripe`,
    expectedEvents: ["checkout.session.completed", "invoice.payment_succeeded", "customer.subscription.created"],
    testingTips: [
      "Use card 4242 4242 4242 4242 for successful payments",
      "Check Stripe Dashboard > Developers > Webhooks for delivery status",
      "Monitor Vercel logs for webhook processing",
    ],
  })
}
