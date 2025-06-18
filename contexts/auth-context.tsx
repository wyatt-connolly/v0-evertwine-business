"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import { app } from "../firebase"

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  // Add other profile fields as needed
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  updateUserProfile: (profileData: UserProfile) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  updateUserProfile: async () => {},
})

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const auth = getAuth(app)
  const db = getFirestore(app)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data() as UserProfile)
        } else {
          // If the document doesn't exist, create a default one
          const defaultProfile: UserProfile = {
            firstName: "",
            lastName: "",
            email: user.email || "",
          }
          await setDoc(userDocRef, defaultProfile)
          setUserProfile(defaultProfile)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [auth, db])

  const updateUserProfile = async (profileData: UserProfile) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(userDocRef, profileData)
      setUserProfile(profileData)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
