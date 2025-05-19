"use client"

import { useState, useEffect } from "react"
import {
  type User,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordReset,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

// Custom hook to get authentication state
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "businesses", currentUser.uid))
          if (userDoc.exists()) {
            setUserProfile(userDoc.data())
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, userProfile, loading }
}

// Sign up function
export async function signUp(email: string, password: string, userData: any) {
  try {
    const userCredential = await firebaseCreateUser(auth, email, password)
    await setDoc(doc(db, "businesses", userCredential.user.uid), {
      ...userData,
      email,
      created_at: new Date().toISOString(),
      status: "pending",
      plan: "free",
      promotions_used: 0,
      promotions_limit: 2,
    })
    return userCredential.user
  } catch (error) {
    console.error("Error in signUp:", error)
    throw error
  }
}

// Sign in function
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await firebaseSignIn(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error("Error in signIn:", error)
    throw error
  }
}

// Logout function
export async function logout() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error("Error in logout:", error)
    throw error
  }
}

// Reset password function
export async function resetPassword(email: string) {
  try {
    await firebaseSendPasswordReset(auth, email)
  } catch (error) {
    console.error("Error in resetPassword:", error)
    throw error
  }
}
