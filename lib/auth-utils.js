"use client"

import { auth, db } from "./firebase"
import { doc, getDoc } from "firebase/firestore"

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
