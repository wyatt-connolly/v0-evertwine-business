"use client"

import { useState, useEffect } from "react"
import { auth, db, firebaseInitError, isFirebaseInitialized } from "@/lib/firebase"
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithRedirect,
} from "firebase/auth"

// Initialize providers
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

// Custom hook to get authentication state
export function useAuthState() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(isFirebaseInitialized())

  useEffect(() => {
    // If Firebase initialization failed, set loading to false
    if (firebaseInitError) {
      console.error("Firebase initialization error in useAuthState:", firebaseInitError)
      setLoading(false)
      return () => {}
    }

    // If auth is not available, set loading to false
    if (!auth) {
      console.error("Firebase auth is not available in useAuthState")
      setLoading(false)
      return () => {}
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)

        if (currentUser && db) {
          try {
            const userDoc = await getDoc(doc(db, "business_users", currentUser.uid))
            if (userDoc.exists()) {
              setUserProfile(userDoc.data())
            } else {
              // Try the old collection name
              const oldUserDoc = await getDoc(doc(db, "businesses", currentUser.uid))
              if (oldUserDoc.exists()) {
                setUserProfile(oldUserDoc.data())
              }
            }
          } catch (err) {
            console.error("Error fetching user profile:", err)
          }
        } else {
          setUserProfile(null)
        }

        setLoading(false)
      },
      (err) => {
        console.error("Auth state change error:", err)
        setLoading(false)
      },
    )

    // Clean up subscription
    return () => unsubscribe()
  }, [])

  return {
    user,
    userProfile,
    loading,
    firebaseInitialized: initialized,
    firebaseInitError,
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
  if (firebaseInitError) {
    console.error("Firebase initialization error in signUp:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth || !db) {
    const error = new Error("Firebase services are not available")
    console.error(error)
    throw error
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
        createdAt: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotionsUsed: 0,
        promotionsLimit: 2,
        authProvider: "email",
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
  if (firebaseInitError) {
    console.error("Firebase initialization error in signIn:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth) {
    const error = new Error("Firebase authentication is not available")
    console.error(error)
    throw error
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error in signIn:", error)
    throw error
  }
}

// Google sign in function
export async function signInWithGoogle() {
  if (firebaseInitError) {
    console.error("Firebase initialization error in signInWithGoogle:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth || !db) {
    const error = new Error("Firebase services are not available")
    console.error(error)
    throw error
  }

  try {
    // Try to use redirect instead of popup for better compatibility
    await signInWithRedirect(auth, googleProvider)
    // Note: The result will be handled in the onAuthStateChanged listener
    // We won't reach this point until after the redirect completes
  } catch (error) {
    console.error("Error in signInWithGoogle:", error)

    // Check for unauthorized domain error
    if (error.code === "auth/unauthorized-domain") {
      const currentDomain = window.location.hostname
      throw new Error(
        `This domain (${currentDomain}) is not authorized for Firebase authentication. Please add it to your Firebase project's authorized domains list.`,
      )
    }

    throw error
  }
}

// Facebook sign in function
export async function signInWithFacebook() {
  if (firebaseInitError) {
    console.error("Firebase initialization error in signInWithFacebook:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth || !db) {
    const error = new Error("Firebase services are not available")
    console.error(error)
    throw error
  }

  try {
    // Try to use redirect instead of popup for better compatibility
    await signInWithRedirect(auth, facebookProvider)
    // Note: The result will be handled in the onAuthStateChanged listener
    // We won't reach this point until after the redirect completes
  } catch (error) {
    console.error("Error in signInWithFacebook:", error)

    // Check for unauthorized domain error
    if (error.code === "auth/unauthorized-domain") {
      const currentDomain = window.location.hostname
      throw new Error(
        `This domain (${currentDomain}) is not authorized for Firebase authentication. Please add it to your Firebase project's authorized domains list.`,
      )
    }

    throw error
  }
}

// Logout function
export async function logout() {
  if (firebaseInitError) {
    console.error("Firebase initialization error in logout:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth) {
    const error = new Error("Firebase authentication is not available")
    console.error(error)
    throw error
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
  if (firebaseInitError) {
    console.error("Firebase initialization error in resetPassword:", firebaseInitError)
    throw firebaseInitError
  }

  if (!auth) {
    const error = new Error("Firebase authentication is not available")
    console.error(error)
    throw error
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
