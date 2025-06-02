import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get all configuration from server-side environment variables
    const config = {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      firebaseConfig: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
    }

    // Validate that all required config is present
    const missingConfig = []

    if (!config.googleMapsApiKey) missingConfig.push("Google Maps API Key")
    if (!config.stripePublishableKey) missingConfig.push("Stripe Publishable Key")
    if (!config.firebaseConfig.apiKey) missingConfig.push("Firebase API Key")
    if (!config.firebaseConfig.authDomain) missingConfig.push("Firebase Auth Domain")
    if (!config.firebaseConfig.projectId) missingConfig.push("Firebase Project ID")
    if (!config.firebaseConfig.storageBucket) missingConfig.push("Firebase Storage Bucket")
    if (!config.firebaseConfig.messagingSenderId) missingConfig.push("Firebase Messaging Sender ID")
    if (!config.firebaseConfig.appId) missingConfig.push("Firebase App ID")

    if (missingConfig.length > 0) {
      console.error("Missing configuration:", missingConfig)
      return NextResponse.json(
        {
          error: "Configuration incomplete",
          missing: missingConfig,
          success: false,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ...config,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching configuration:", error)
    return NextResponse.json({ error: "Failed to fetch configuration", success: false }, { status: 500 })
  }
}
