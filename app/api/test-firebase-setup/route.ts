import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check all environment variables
    const envVars = {
      // Firebase Client (Public)
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

      // Firebase Admin (Private)
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "SET" : "MISSING",

      // Stripe (can be test keys)
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "SET" : "MISSING",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "MISSING",
    }

    // Analyze Firebase project type
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const isTestProject = projectId?.includes("test") || projectId?.includes("dev") || projectId?.includes("staging")

    // Analyze Stripe keys
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const isTestStripe = stripeKey?.startsWith("sk_test_")
    const isLiveStripe = stripeKey?.startsWith("sk_live_")

    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const isTestStripePublic = stripePublicKey?.startsWith("pk_test_")

    // Check private key format
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
    const privateKeyAnalysis = privateKey
      ? {
          length: privateKey.length,
          hasBeginMarker: privateKey.includes("-----BEGIN PRIVATE KEY-----"),
          hasEndMarker: privateKey.includes("-----END PRIVATE KEY-----"),
          hasEscapedNewlines: privateKey.includes("\\n"),
          hasActualNewlines: privateKey.includes("\n"),
          startsWithQuote: privateKey.startsWith('"'),
          endsWithQuote: privateKey.endsWith('"'),
          preview: `${privateKey.substring(0, 50)}...${privateKey.substring(privateKey.length - 50)}`,
        }
      : null

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),

      // Environment Analysis
      environment: {
        allVariables: envVars,
        missingVariables: Object.entries(envVars)
          .filter(([key, value]) => !value || value === "MISSING")
          .map(([key]) => key),
      },

      // Project Analysis
      projectAnalysis: {
        projectId,
        appearsToBeTestProject: isTestProject,
        recommendation: isTestProject
          ? "✅ Using test/development Firebase project - perfect for testing!"
          : "⚠️ This appears to be a production Firebase project",
      },

      // Stripe Analysis
      stripeAnalysis: {
        secretKey: {
          isTest: isTestStripe,
          isLive: isLiveStripe,
          status: isTestStripe ? "✅ Test key" : isLiveStripe ? "⚠️ Live key" : "❌ Invalid format",
        },
        publishableKey: {
          isTest: isTestStripePublic,
          status: isTestStripePublic ? "✅ Test key" : "❌ Not test key or missing",
        },
        recommendation:
          isTestStripe && isTestStripePublic
            ? "✅ Using Stripe test keys - perfect for development!"
            : "⚠️ Mix of test/live keys or missing keys detected",
      },

      // Private Key Analysis
      privateKeyAnalysis,

      // Setup Instructions
      setupInstructions: {
        firebaseTestProject: [
          "1. Go to https://console.firebase.google.com/",
          "2. Create a new project with a name like 'your-app-test' or 'your-app-dev'",
          "3. Enable Firestore Database in test mode",
          "4. Go to Project Settings > Service Accounts",
          "5. Click 'Generate new private key' and download the JSON file",
          "6. Extract the values for your environment variables",
        ],
        stripeTestKeys: [
          "1. Go to https://dashboard.stripe.com/test/dashboard",
          "2. Make sure you're in 'Test mode' (toggle in left sidebar)",
          "3. Go to Developers > API keys",
          "4. Copy the 'Publishable key' (starts with pk_test_)",
          "5. Reveal and copy the 'Secret key' (starts with sk_test_)",
          "6. Go to Developers > Webhooks to set up webhook endpoint",
        ],
        environmentVariables: [
          "Create a .env.local file in your project root with:",
          "",
          "# Firebase Client Config (from Firebase Console > Project Settings > General)",
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-test-project-id",
          "NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key",
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-test-project.firebaseapp.com",
          "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-test-project.appspot.com",
          "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789",
          "NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef",
          "",
          "# Firebase Admin Config (from Service Account JSON)",
          'FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-test-project.iam.gserviceaccount.com"',
          'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG...\\n-----END PRIVATE KEY-----\\n"',
          "",
          "# Stripe Test Keys",
          "STRIPE_SECRET_KEY=sk_test_xxxxx",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx",
          "STRIPE_WEBHOOK_SECRET=whsec_xxxxx",
        ],
      },

      // Next Steps
      nextSteps: [
        !envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID && "Set up Firebase test project and add project ID",
        !envVars.FIREBASE_CLIENT_EMAIL && "Add Firebase service account email",
        !envVars.FIREBASE_PRIVATE_KEY && "Add Firebase private key (properly escaped)",
        !isTestStripe && "Set up Stripe test keys",
        privateKeyAnalysis && !privateKeyAnalysis.hasBeginMarker && "Fix private key format - missing BEGIN marker",
        privateKeyAnalysis && !privateKeyAnalysis.hasEndMarker && "Fix private key format - missing END marker",
        privateKeyAnalysis && !privateKeyAnalysis.hasEscapedNewlines && "Escape newlines in private key (\\n)",
        "Test the setup with /api/test-firebase-admin",
        "Create a test user and subscription in your test environment",
      ].filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
