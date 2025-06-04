// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin if not already initialized
let db

try {
  // Only initialize if no apps exist
  if (!getApps().length) {
    console.log("🔧 Initializing Firebase Admin SDK...")

    // Get environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    // Log environment variable presence for debugging (without revealing values)
    console.log("Firebase Admin Environment Variables Check:")
    console.log("- NEXT_PUBLIC_FIREBASE_PROJECT_ID:", !!projectId, projectId ? `(${projectId})` : "(missing)")
    console.log(
      "- FIREBASE_CLIENT_EMAIL:",
      !!clientEmail,
      clientEmail ? `(${clientEmail.substring(0, 20)}...)` : "(missing)",
    )
    console.log("- FIREBASE_PRIVATE_KEY:", !!privateKey, privateKey ? `(${privateKey.length} chars)` : "(missing)")

    // Validate required environment variables
    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing from environment variables")
    }

    if (!clientEmail) {
      throw new Error("FIREBASE_CLIENT_EMAIL is missing from environment variables")
    }

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY is missing from environment variables")
    }

    // Handle different formats of private key that might be stored in environment variables
    console.log("🔑 Processing private key format...")

    // Handle case where the key might be JSON stringified (wrapped in quotes)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      console.log("📝 Removing JSON string quotes from private key")
      privateKey = privateKey.slice(1, -1)
    }

    // Replace escaped newlines with actual newlines
    if (privateKey.includes("\\n")) {
      console.log("📝 Converting escaped newlines to actual newlines")
      privateKey = privateKey.replace(/\\n/g, "\n")
    }

    // Add the BEGIN/END markers if they're missing
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      console.log("📝 Adding BEGIN PRIVATE KEY marker")
      privateKey = "-----BEGIN PRIVATE KEY-----\n" + privateKey
    }

    if (!privateKey.includes("-----END PRIVATE KEY-----")) {
      console.log("📝 Adding END PRIVATE KEY marker")
      privateKey = privateKey + "\n-----END PRIVATE KEY-----"
    }

    // Ensure proper formatting
    privateKey = privateKey
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----")
      .replace(/\n\n+/g, "\n") // Remove multiple consecutive newlines

    console.log("✅ Private key format processed")
    console.log("🔍 Key preview:", privateKey.substring(0, 50) + "...")

    // Create the credential object
    const credential = cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    })

    console.log("🚀 Initializing Firebase Admin app...")

    // Initialize the app with the service account
    const app = initializeApp({
      credential: credential,
    })

    console.log("✅ Firebase Admin initialized successfully")
    console.log("📊 App name:", app.name)
    console.log("📊 Project ID:", app.options.projectId)

    // Get Firestore instance
    db = getFirestore(app)
    console.log("✅ Firestore instance created")
  } else {
    console.log("♻️ Firebase Admin already initialized, reusing existing instance")
    db = getFirestore()
  }
} catch (error) {
  console.error("❌ Firebase admin initialization error:", error.message)
  console.error("🔍 Full error:", error)

  // Create a fallback db object that throws clear errors when used
  db = new Proxy(
    {},
    {
      get: (target, prop) => {
        throw new Error(
          `Firebase Admin SDK failed to initialize: ${error.message}. Check your environment variables and private key format.`,
        )
      },
    },
  )
}

export { db }
