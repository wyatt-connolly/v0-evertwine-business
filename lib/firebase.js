"use client"

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Initialize Firebase configuration state
let app
let auth
let db
let storage
let firebaseInitError = null
let isInitialized = false
let initializationPromise = null

// Function to get the base URL for API calls
function getBaseUrl() {
  // In browser environment
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  // In server environment, try to get from environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }

  // Fallback for local development
  return "http://localhost:3000"
}

// Function to fetch configuration from server
async function fetchFirebaseConfig() {
  try {
    console.log("🔧 Fetching Firebase configuration from server...")

    // Construct full URL for the API call
    const baseUrl = getBaseUrl()
    const configUrl = `${baseUrl}/api/config`

    console.log("📡 Making request to:", configUrl)

    const response = await fetch(configUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add cache control to prevent caching issues
      cache: "no-cache",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch configuration")
    }

    console.log("✅ Firebase configuration fetched successfully")
    return data.firebaseConfig
  } catch (error) {
    console.error("❌ Error fetching Firebase configuration:", error)

    // Fallback to environment variables if API call fails
    console.log("🔄 Falling back to environment variables...")

    const fallbackConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Check if we have the required environment variables
    if (fallbackConfig.apiKey && fallbackConfig.projectId) {
      console.log("✅ Using fallback environment variables")
      return fallbackConfig
    }

    throw error
  }
}

// Function to initialize Firebase with server-provided config
async function initializeFirebase() {
  if (isInitialized) {
    return { app, auth, db, storage, firebaseInitError }
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      console.log("🚀 Initializing Firebase...")

      // Fetch configuration from server or fallback to env vars
      const firebaseConfig = await fetchFirebaseConfig()

      // Validate configuration
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Missing required Firebase configuration")
      }

      // Initialize Firebase app
      app = initializeApp(firebaseConfig)
      console.log("✅ Firebase app initialized")

      // Initialize services
      try {
        auth = getAuth(app)
        console.log("✅ Firebase Auth initialized")
      } catch (authError) {
        console.error("❌ Firebase Auth initialization error:", authError)
        firebaseInitError = authError
      }

      try {
        db = getFirestore(app)
        console.log("✅ Firestore initialized")
      } catch (dbError) {
        console.error("❌ Firestore initialization error:", dbError)
        firebaseInitError = dbError
      }

      try {
        storage = getStorage(app)
        console.log("✅ Firebase Storage initialized")
      } catch (storageError) {
        console.error("❌ Firebase Storage initialization error:", storageError)
        firebaseInitError = storageError
      }

      isInitialized = true
      console.log("🎉 Firebase initialization complete")
    } catch (error) {
      console.error("❌ Firebase initialization failed:", error)
      firebaseInitError = error
    }

    return { app, auth, db, storage, firebaseInitError }
  })()

  return initializationPromise
}

// Export a function to check if Firebase is properly initialized
export function isFirebaseInitialized() {
  return isInitialized && !!app && !!auth && !!db && !!storage && !firebaseInitError
}

// Export a function to get Firebase services (initializes if needed)
export async function getFirebaseServices() {
  if (!isInitialized) {
    await initializeFirebase()
  }
  return { app, auth, db, storage, firebaseInitError }
}

// Only initialize Firebase automatically in browser environment
if (typeof window !== "undefined") {
  initializeFirebase()
}

// Export the services (they will be undefined until initialization completes)
export { app, auth, db, storage, firebaseInitError }
