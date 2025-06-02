// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin if not already initialized
let db

try {
  // Only initialize if no apps exist
  if (!getApps().length) {
    // Handle different formats of private key that might be stored in environment variables
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    // Handle case where the key might be JSON stringified
    if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = JSON.parse(privateKey)
    }

    // Replace escaped newlines with actual newlines
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n")
    }

    // Log environment variable presence for debugging (without revealing values)
    console.log("Firebase Admin Environment Variables Check:")
    console.log("- NEXT_PUBLIC_FIREBASE_PROJECT_ID:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    console.log("- FIREBASE_CLIENT_EMAIL:", !!process.env.FIREBASE_CLIENT_EMAIL)
    console.log("- FIREBASE_PRIVATE_KEY:", !!privateKey)

    // Validate required environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing")
    }

    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_CLIENT_EMAIL is missing")
    }

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY is missing or invalid")
    }

    // Initialize the app with the service account
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })

    console.log("✅ Firebase Admin initialized successfully")
  }

  // Get Firestore instance
  db = getFirestore()
} catch (error) {
  console.error("❌ Firebase admin initialization error:", error)

  // Create a fallback db object that throws clear errors when used
  db = new Proxy(
    {},
    {
      get: () => {
        throw new Error(
          "Firebase Admin SDK failed to initialize. Check your environment variables and private key format.",
        )
      },
    },
  )
}

export { db }
