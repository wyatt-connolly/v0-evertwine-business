"use client"

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Use environment variables if available, otherwise use direct configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBM1Cwq71TQiBoOFlTLRbBc95EZpQ7UFA0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "evertwine-qm8y7p.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "evertwine-qm8y7p",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "evertwine-qm8y7p.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "177107134327",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:177107134327:web:805df5fec75b3432e8e372",
}

// Initialize Firebase
let app
let auth
let db
let storage
let firebaseInitError = null

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig)

  try {
    auth = getAuth(app)
  } catch (authError) {
    console.error("Firebase Auth initialization error:", authError)
    firebaseInitError = authError
  }

  try {
    db = getFirestore(app)
  } catch (dbError) {
    console.error("Firestore initialization error:", dbError)
    firebaseInitError = dbError
  }

  try {
    storage = getStorage(app)
  } catch (storageError) {
    console.error("Firebase Storage initialization error:", storageError)
    firebaseInitError = storageError
  }
} catch (error) {
  console.error("Firebase app initialization error:", error)
  firebaseInitError = error
}

// Export a function to check if Firebase is properly initialized
export function isFirebaseInitialized() {
  return !!app && !!auth && !!db && !!storage && !firebaseInitError
}

export { app, auth, db, storage, firebaseInitError }
