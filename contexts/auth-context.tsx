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
  FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { getFirebaseServices } from "@/lib/firebase"

// Initialize providers
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

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
  signInWithFacebook: () => Promise<void>
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
  signInWithFacebook: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
})

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  // Simple subscription check using boolean field
  const checkSubscription = useCallback((userData: any) => {
    if (!userData) {
      setHasActiveSubscription(false)
      return
    }

    // Primary check: use the simple boolean field
    if (userData.is_subscribed === true || userData.subscription_active === true) {
      setHasActiveSubscription(true)
      return
    }

    // Fallback: check the old way for backwards compatibility
    const subscriptionStatus = userData.subscription_status
    const subscriptionEnd = userData.subscription_end

    if (subscriptionStatus === "active" && subscriptionEnd) {
      const endDate = new Date(subscriptionEnd)
      const now = new Date()
      const isActiveByDate = endDate > now
      setHasActiveSubscription(isActiveByDate)
    } else {
      setHasActiveSubscription(false)
    }
  }, [])

  // Add refresh function
  const refreshSubscription = useCallback(async () => {
    if (!user) return

    try {
      const { db } = await getFirebaseServices()
      if (!db) return

      const userDoc = await getDoc(doc(db, "business_users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile(userData)
        checkSubscription(userData)
      }
    } catch (error) {
      console.error("Error refreshing subscription:", error)
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
      created_at: new Date().toISOString(),
      status: "pending",
      plan: "free",
      promotions_used: 0,
      promotions_limit: 2,
      auth_provider: "email",
      // Initialize subscription fields
      is_subscribed: false,
      subscription_active: false,
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
        created_at: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotions_used: 0,
        promotions_limit: 2,
        auth_provider: "google",
        // Initialize subscription fields
        is_subscribed: false,
        subscription_active: false,
      })
    }
  }

  // Facebook sign in function
  const signInWithFacebook = async () => {
    const { auth, db } = await getFirebaseServices()

    if (!auth || !db) {
      throw new Error("Firebase services not available")
    }

    const result = await signInWithPopup(auth, facebookProvider)
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
        created_at: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotions_used: 0,
        promotions_limit: 2,
        auth_provider: "facebook",
        // Initialize subscription fields
        is_subscribed: false,
        subscription_active: false,
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
    const initializeAuth = async () => {
      try {
        const { auth, db } = await getFirebaseServices()

        if (!auth) {
          console.error("Firebase auth not available")
          setLoading(false)
          return
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser)

          if (currentUser && db) {
            try {
              // Get user profile from business_users collection
              const userDoc = await getDoc(doc(db, "business_users", currentUser.uid))

              if (userDoc.exists()) {
                const userData = userDoc.data()
                setUserProfile(userData)
                checkSubscription(userData)
              } else {
                console.log("No user profile found")
                setUserProfile(null)
                setHasActiveSubscription(false)
              }
            } catch (error) {
              console.error("Error fetching user profile:", error)
              setUserProfile(null)
              setHasActiveSubscription(false)
            }
          } else {
            setUserProfile(null)
            setHasActiveSubscription(false)
          }

          setLoading(false)
        })

        return () => unsubscribe()
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
      }
    }

    initializeAuth()
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
    signInWithFacebook,
    logout,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext)
}
