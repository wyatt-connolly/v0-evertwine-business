// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // For development, you can use the Firebase emulator or service account key
    // In production, use environment variables for the service account

    // Fix the private key formatting issue
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined

    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY environment variable is missing or empty")
    }

    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }

    // Check if required environment variables are present
    if (!serviceAccount.projectId || !serviceAccount.clientEmail) {
      throw new Error("Required Firebase environment variables are missing")
    }

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })

    console.log("Firebase Admin initialized successfully")
  } catch (error) {
    console.error("Firebase admin initialization error:", error)
  }
}

export const db = getFirestore()
