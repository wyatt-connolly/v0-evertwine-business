"use client"

import { auth, db } from "./firebase"
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth"
import { useState, useEffect } from "react"

// Initialize Google provider only
const googleProvider = new GoogleAuthProvider()

// Add additional scopes and parameters for better user experience
googleProvider.addScope("email")
googleProvider.addScope("profile")
googleProvider.setCustomParameters({
  prompt: "select_account",
})

// Check if user is authenticated
export const isAuthenticated = () => {
  return auth.currentUser !== null
}

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser
}

// Get user profile from Firestore
export const getUserProfile = async (uid) => {
  if (!db) {
    throw new Error("Firestore not available")
  }

  try {
    const userDoc = await getDoc(doc(db, "business_users", uid))
    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }
}

// Format date helper function
export const formatDate = (date) => {
  if (!date) return "N/A"

  try {
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString()
    }

    // Handle regular Date object
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }

    // Handle string dates
    if (typeof date === "string") {
      const parsedDate = new Date(date)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString()
      }
    }

    return "Invalid Date"
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

// Custom hook to get authentication state
export function useAuthState() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firebaseInitialized, setFirebaseInitialized] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔧 Initializing authentication...")

        if (!auth || !db) {
          console.error("❌ Firebase services not available")
          setLoading(false)
          return
        }

        console.log("✅ Firebase services ready, setting up auth listener")
        setFirebaseInitialized(true)

        // Check for redirect result first
        try {
          const result = await getRedirectResult(auth)
          if (result) {
            console.log("🔄 Processing redirect result:", result.user.email)
            await handleSocialAuthUser(result.user, "google")
          }
        } catch (redirectError) {
          console.error("❌ Error processing redirect result:", redirectError)
        }

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(
          auth,
          async (currentUser) => {
            console.log("👤 Auth state changed:", currentUser ? `User: ${currentUser.email}` : "User logged out")
            setUser(currentUser)

            if (currentUser) {
              try {
                const userDoc = await getDoc(doc(db, "business_users", currentUser.uid))
                if (userDoc.exists()) {
                  setUserProfile(userDoc.data())
                  console.log("✅ User profile loaded")
                } else {
                  console.log("⚠️ No user profile found, creating one...")
                  // Create profile if it doesn't exist (for social auth users)
                  await createUserProfile(currentUser)
                }
              } catch (err) {
                console.error("❌ Error fetching user profile:", err)
              }
            } else {
              setUserProfile(null)
            }

            setLoading(false)
          },
          (err) => {
            console.error("❌ Auth state change error:", err)
            setLoading(false)
          },
        )

        // Clean up subscription
        return () => unsubscribe()
      } catch (error) {
        console.error("❌ Error initializing auth:", error)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  return {
    user,
    userProfile,
    loading,
    firebaseInitialized: true, // Always true since we're using direct imports
  }
}

// Helper function to handle social auth users
async function handleSocialAuthUser(user, provider) {
  if (!db) return

  try {
    const userDoc = await getDoc(doc(db, "business_users", user.uid))

    if (!userDoc.exists()) {
      console.log("🆕 Creating new user profile for social auth user")
      await createUserProfile(user, provider)
    } else {
      console.log("✅ Existing user profile found")
    }
  } catch (error) {
    console.error("❌ Error handling social auth user:", error)
  }
}

// Helper function to create user profile
async function createUserProfile(user, provider = "email") {
  if (!db) {
    throw new Error("Firestore not available")
  }

  try {
    await setDoc(doc(db, "business_users", user.uid), {
      name: user.displayName || "",
      email: user.email,
      phone: user.phoneNumber || "",
      photo_url: user.photoURL || "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      auth_provider: provider,
    })
    console.log("✅ User profile created successfully")
  } catch (error) {
    console.error("❌ Error creating user profile:", error)
    throw error
  }
}

// Check if email already exists in business_users collection
async function checkEmailExists(email) {
  if (!db) {
    throw new Error("Firebase services are not available")
  }

  try {
    const usersRef = collection(db, "business_users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error("Error checking email existence:", error)
    throw error
  }
}

// Sign up function
export async function signUp(email, password, userData) {
  if (!auth || !db) {
    throw new Error("Firebase services are not available")
  }

  try {
    // First check if email already exists
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      throw new Error("EMAIL_ALREADY_EXISTS")
    }

    // Create the user authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    try {
      // Then write to Firestore in business_users collection
      await setDoc(doc(db, "business_users", userCredential.user.uid), {
        ...userData,
        email,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        auth_provider: "email",
      })
    } catch (firestoreError) {
      console.error("Error writing to Firestore:", firestoreError)

      // If it's a permission error, add specific information
      if (firestoreError.code === "permission-denied") {
        throw new Error(
          "Account created but profile data couldn't be saved. Firebase security rules are preventing writes to the database. Please check your Firestore security rules.",
        )
      }

      throw new Error(`Account created but profile data couldn't be saved: ${firestoreError.message}`)
    }

    return userCredential.user
  } catch (error) {
    console.error("Error in signUp:", error)

    // If the error is not our custom EMAIL_ALREADY_EXISTS error and the user was created
    // but we couldn't write to Firestore, we should clean up by deleting the user
    if (
      error.message !== "EMAIL_ALREADY_EXISTS" &&
      error.message &&
      error.message.includes("Account created but profile data couldn't be saved")
    ) {
      try {
        // Get the current user and delete them
        const currentUser = auth.currentUser
        if (currentUser) {
          await currentUser.delete()
        }
      } catch (deleteError) {
        console.error("Error cleaning up user after Firestore write failure:", deleteError)
      }
    }

    throw error
  }
}

// Sign in function
export async function signIn(email, password) {
  if (!auth) {
    throw new Error("Firebase authentication is not available")
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error in signIn:", error)
    throw error
  }
}

// Google sign in function - using popup instead of redirect
export async function signInWithGoogle() {
  if (!auth || !db) {
    throw new Error("Firebase services are not available")
  }

  try {
    console.log("🚀 Starting Google sign-in with popup...")

    // Use popup instead of redirect for better UX
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    console.log("✅ Google sign-in successful:", user.email)

    // Handle user profile creation
    await handleSocialAuthUser(user, "google")

    return user
  } catch (error) {
    console.error("❌ Error in signInWithGoogle:", error)

    // Check for unauthorized domain error
    if (error.code === "auth/unauthorized-domain") {
      const currentDomain = window.location.hostname
      throw new Error(
        `This domain (${currentDomain}) is not authorized for Firebase authentication. Please add it to your Firebase project's authorized domains list.`,
      )
    }

    // Handle popup blocked
    if (error.code === "auth/popup-blocked") {
      throw new Error("Popup was blocked by your browser. Please allow popups for this site and try again.")
    }

    // Handle popup closed
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled. Please try again.")
    }

    throw error
  }
}

// Logout function
export async function logout() {
  if (!auth) {
    throw new Error("Firebase authentication is not available")
  }

  try {
    await signOut(auth)
  } catch (error) {
    console.error("Error in logout:", error)
    throw error
  }
}

// Reset password function
export async function resetPassword(email) {
  if (!auth) {
    throw new Error("Firebase authentication is not available")
  }

  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error("Error in resetPassword:", error)
    throw error
  }
}

// Check if the current environment is a development or preview environment
export function isPreviewEnvironment() {
  if (typeof window === "undefined") return false

  const hostname = window.location.hostname

  // Only consider these specific domains as preview environments
  const previewDomains = ["localhost", "127.0.0.1", "v0.dev"]

  // Check if the hostname matches any of the preview domains
  return previewDomains.some((domain) => hostname.includes(domain))
}

// Handle redirect result - simplified since we're using popup
export async function handleAuthRedirect() {
  if (!auth) return null

  try {
    const result = await getRedirectResult(auth)
    if (result) {
      console.log("🔄 Processing auth redirect result:", result.user.email)
      await handleSocialAuthUser(result.user, result.providerId.includes("google") ? "google" : "facebook")
      return result.user
    }
    return null
  } catch (error) {
    console.error("Error handling redirect result:", error)
    throw error
  }
}
