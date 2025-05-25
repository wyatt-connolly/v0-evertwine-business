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
import { getFirebaseServices } from "@/lib/firebase"

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
    const { auth, db } = await getFirebaseServices()

    if (!auth || !db) {
      throw new Error("Firebase services not available")
    }

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
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotionsUsed: 0,
        promotionsLimit: 2,
        authProvider: "google",
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
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        status: "pending",
        plan: "free",
        promotionsUsed: 0,
        promotionsLimit: 2,
        authProvider: "facebook",
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
                setUserProfile(userDoc.data())
              } else {
                console.log("No user profile found")
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
      } catch (error) {
        console.error("Error initializing auth:", error)
        setLoading(false)
      }
    }

    initializeAuth()
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
