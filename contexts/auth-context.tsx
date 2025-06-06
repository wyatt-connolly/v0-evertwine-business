"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseServices } from "@/lib/firebase"

// Initialize Google provider only
const googleProvider = new GoogleAuthProvider()

// Define the shape of our context
type AuthContextType = {
  user: User | null
  loading: boolean
  userProfile: any
  hasActiveSubscription: boolean
  refreshSubscription: () => Promise<void>
  signUp: (email: string, password: string, userData: any) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  hasActiveSubscription: false,
  refreshSubscription: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
})

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Simple subscription check function
  const checkSubscription = useCallback((userData: any) => {
    if (!userData) {
      setHasActiveSubscription(false)
      return
    }

    // Priority 1: Check boolean fields (faster and more reliable)
    if (userData.is_subscribed === true || userData.subscription_active === true) {
      setHasActiveSubscription(true)
      return
    }

    if (userData.is_subscribed === false || userData.subscription_active === false) {
      setHasActiveSubscription(false)
      return
    }

    // Priority 2: Fallback to date-based logic for backwards compatibility
    const subscriptionStatus = userData.subscription_status
    const subscriptionEnd = userData.subscription_end

    if (subscriptionStatus === "active" && subscriptionEnd) {
      const endDate = new Date(subscriptionEnd)
      const now = new Date()
      setHasActiveSubscription(endDate > now)
    } else {
      setHasActiveSubscription(false)
    }
  }, [])

  // Refresh subscription function
  const refreshSubscription = useCallback(async () => {
    if (!user) return

    try {
      const { db } = await getFirebaseServices()
      if (!db) {
        console.error("Firebase db not available for refresh")
        return
      }

      console.log(`🔄 Refreshing subscription for user: ${user.uid}`)

      const userDoc = await getDoc(doc(db, "business_users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
        checkSubscription(userData)
        console.log(`✅ Subscription refreshed:`, {
          hasSubscription: userData.subscription_status === "active",
          endDate: userData.subscription_end,
        })
      } else {
        console.log(`❌ User document not found during refresh: ${user.uid}`)
      }
    } catch (error) {
      console.error("❌ Error refreshing subscription:", error)
    }
  }, [user, checkSubscription])

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    const { auth, db } = await getFirebaseServices()

    if (!auth || !db) {
      throw new Error("Firebase services not available")
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, "business_users", userCredential.user.uid), {
      ...userData,
      email,
      created_at: serverTimestamp(), // Use server timestamp
      status: "pending",
      plan: "free",
      promotions_used: 0,
      promotions_limit: 2,
      auth_provider: "email",
      // Initialize subscription fields
      subscription_active: false,
      is_subscribed: false,
    })
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const { auth } = await getFirebaseServices()

    if (!auth) {
      throw new Error("Firebase auth not available")
    }

    await signInWithEmailAndPassword(auth, email, password)
  }

  // Google sign in function
  const signInWithGoogle = async () => {
    const { auth, db } = await getFirebaseServices()

    if (!auth || !db) {
      throw new Error("Firebase services not available")
    }

    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, "business_users", user.uid))

    // If user doesn't exist in Firestore, create a new profile
    if (!userDoc.exists()) {
      await setDoc(doc(db, "business_users", user.uid), {
        name: user.displayName || "",
        email: user.email,
        phone: user.phoneNumber || "",
        photo_url: user.photoURL || "",
        created_at: serverTimestamp(), // Use server timestamp
        status: "pending",
        plan: "free",
        promotions_used: 0,
        promotions_limit: 2,
        auth_provider: "google",
        // Initialize subscription fields
        subscription_active: false,
        is_subscribed: false,
      })
    }
  }

  // Logout function
  const logout = async () => {
    const { auth } = await getFirebaseServices()

    if (!auth) {
      throw new Error("Firebase auth not available")
    }

    await signOut(auth)
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    const { auth } = await getFirebaseServices()

    if (!auth) {
      throw new Error("Firebase auth not available")
    }

    await sendPasswordResetEmail(auth, email)
  }

  // Listen for auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing auth context...")

        const { auth, db } = await getFirebaseServices()

        if (!auth) {
          console.error("❌ Firebase auth not available")
          setLoading(false)
          return
        }

        if (!db) {
          console.error("❌ Firebase db not available")
          setLoading(false)
          return
        }

        console.log("✅ Firebase services available, setting up auth listener")

        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          console.log("🔄 Auth state changed:", currentUser ? `User: ${currentUser.uid}` : "No user")
          setUser(currentUser)

          if (currentUser) {
            try {
              // Get user profile from business_users collection
              const userDoc = await getDoc(doc(db, "business_users", currentUser.uid))

              if (userDoc.exists()) {
                const userData = userDoc.data()
                setUserProfile(userData)
                checkSubscription(userData)
                console.log("✅ User profile loaded and subscription checked")
              } else {
                console.log("❌ No user profile found")
                setUserProfile(null)
                setHasActiveSubscription(false)
              }
            } catch (error) {
              console.error("❌ Error fetching user profile:", error)
              setUserProfile(null)
              setHasActiveSubscription(false)
            }
          } else {
            setUserProfile(null)
            setHasActiveSubscription(false)
          }

          setLoading(false)
        })
      } catch (error) {
        console.error("❌ Error initializing auth:", error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [checkSubscription])

  // Create value object
  const value = {
    user,
    loading,
    userProfile,
    hasActiveSubscription,
    refreshSubscription,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext)
}
