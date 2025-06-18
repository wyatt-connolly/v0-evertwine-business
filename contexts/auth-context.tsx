"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface AuthContextProps {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUser: (displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextProps | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(userRef)

        if (docSnap.exists()) {
          setUser(user)
        } else {
          // If the document doesn't exist, create it
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            displayName: user.displayName || "New User",
            createdAt: serverTimestamp(),
          })
          setUser(user)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, { displayName: username })

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: username,
        createdAt: serverTimestamp(),
      })

      setUser(user) // Update local state immediately after signup
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const updateUser = async (displayName: string) => {
    try {
      if (user) {
        await updateProfile(user, { displayName })

        // Update the user document in Firestore as well
        const userRef = doc(db, "users", user.uid)
        await setDoc(
          userRef,
          {
            ...user,
            displayName: displayName,
          },
          { merge: true },
        )

        setUser({ ...user, displayName: displayName }) // Update local state immediately
      }
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const value: AuthContextProps = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
