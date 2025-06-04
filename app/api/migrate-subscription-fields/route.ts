import { type NextRequest, NextResponse } from "next/server"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    // Get all business users
    const usersSnapshot = await getDocs(collection(db, "business_users"))
    const updates = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const userId = userDoc.id

      // Skip if already has the new fields
      if (userData.hasOwnProperty("is_subscribed") && userData.hasOwnProperty("subscription_active")) {
        continue
      }

      // Determine subscription status using old logic
      let isSubscribed = false
      const subscriptionStatus = userData.subscription_status
      const subscriptionEnd = userData.subscription_end

      if (subscriptionStatus === "active" && subscriptionEnd) {
        const endDate = new Date(subscriptionEnd)
        const now = new Date()
        isSubscribed = endDate > now
      }

      // Update the document
      const updateData = {
        is_subscribed: isSubscribed,
        subscription_active: isSubscribed,
        updated_at: new Date().toISOString(),
      }

      await updateDoc(doc(db, "business_users", userId), updateData)
      updates.push({ userId, isSubscribed })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} users`,
      updates,
    })
  } catch (error: any) {
    console.error("Error migrating subscription fields:", error)
    return NextResponse.json({ error: "Failed to migrate", details: error.message }, { status: 500 })
  }
}
