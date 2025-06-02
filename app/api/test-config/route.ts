import { NextResponse } from "next/server"

export async function GET() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ]

  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])
  const present = requiredEnvVars.filter((envVar) => process.env[envVar])

  return NextResponse.json({
    success: missing.length === 0,
    present: present.map((env) => ({
      name: env,
      hasValue: !!process.env[env],
      preview: env.includes("PUBLISHABLE") ? process.env[env] : "***hidden***",
    })),
    missing,
    message: missing.length === 0 ? "All environment variables configured!" : `Missing: ${missing.join(", ")}`,
  })
}
