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

// Function to fetch configuration from server
async function fetchFirebaseConfig() {
  try {
    console.log("🔧 Fetching Firebase configuration from server...")
    const response = await fetch("/api/config")
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch configuration")
    }

    console.log("✅ Firebase configuration fetched successfully")
    return data.firebaseConfig
  } catch (error) {
    console.error("❌ Error fetching Firebase configuration:", error)
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

      // Fetch configuration from server
      const firebaseConfig = await fetchFirebaseConfig()

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

// Initialize Firebase immediately when this module is imported
initializeFirebase()

// Export the services (they will be undefined until initialization completes)
export { app, auth, db, storage, firebaseInitError }
