"use client"

import { useState, useEffect } from "react"
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

const useAuthState = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(userRef)

        if (docSnap.exists()) {
          // Document exists, use existing data
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            ...docSnap.data(),
          })
        } else {
          // Document doesn't exist, create it
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }
          await setDoc(userRef, newUser)
          setUser(newUser)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(userRef)

      if (!docSnap.exists()) {
        // Document doesn't exist, create it
        const newUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }
        await setDoc(userRef, newUser)
      }

      return user
    } catch (error) {
      console.error("Error signing in with Google", error)
      throw error
    }
  }

  const signOutUser = async () => {
    const auth = getAuth()
    try {
      await signOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error signing out", error)
    }
  }

  return { user, loading, signInWithGoogle, signOutUser }
}

export default useAuthState
