"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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
import { auth, db } from "@/lib/firebase"

// Initialize providers
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()

// Define the shape of our context
type AuthContextType = {
  user: User | null
  loading: boolean
  userProfile: any
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

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
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
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  // Google sign in function
  const signInWithGoogle = async () => {
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
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotionsUsed: 0,
        promotionsLimit: 2,
        authProvider: "google",
        onboardingComplete: false,
      })
    }
  }

  // Facebook sign in function
  const signInWithFacebook = async () => {
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
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotionsUsed: 0,
        promotionsLimit: 2,
        authProvider: "facebook",
        onboardingComplete: false,
      })
    }
  }

  // Logout function
  const logout = async () => {
    await signOut(auth)
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          // First try to get from business_users collection (new)
          let userDoc = await getDoc(doc(db, "business_users", currentUser.uid))

          // If not found, try the old businesses collection
          if (!userDoc.exists()) {
            userDoc = await getDoc(doc(db, "businesses", currentUser.uid))
          }

          if (userDoc.exists()) {
            setUserProfile(userDoc.data())
          } else {
            console.log("No user profile found in either collection")
            setUserProfile(null)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Create value object
  const value = {
    user,
    loading,
    userProfile,
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
