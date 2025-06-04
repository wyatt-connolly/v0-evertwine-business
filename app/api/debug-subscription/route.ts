import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
  }

  try {
    const userDoc = await getDoc(doc(db, "business_users", userId))

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const now = new Date()
    const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null

    return NextResponse.json({
      debug: {
        userId,
        currentTime: now.toISOString(),
        subscriptionStatus: userData.subscription_status,
        subscriptionEnd: userData.subscription_end,
        subscriptionEndParsed: subscriptionEnd?.toISOString(),
        isEndDateValid: subscriptionEnd ? subscriptionEnd > now : false,
        isActive: userData.subscription_status === "active" && subscriptionEnd && subscriptionEnd > now,
        rawUserData: {
          subscription_status: userData.subscription_status,
          subscription_start: userData.subscription_start,
          subscription_end: userData.subscription_end,
          subscription_id: userData.subscription_id,
          customer_id: userData.customer_id,
          updated_at: userData.updated_at,
        },
      },
    })
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json({ error: "Failed to check subscription", details: error.message }, { status: 500 })
  }
}
