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
    const subscriptionStatus = userData.subscription_status
    const subscriptionEnd = userData.subscription_end
    const subscriptionId = userData.subscription_id

    return NextResponse.json({
      userId,
      subscriptionStatus,
      subscriptionEnd,
      subscriptionId,
      isActive: subscriptionStatus === "active" && subscriptionEnd && new Date(subscriptionEnd) > new Date(),
      userData: {
        subscription_status: userData.subscription_status,
        subscription_start: userData.subscription_start,
        subscription_end: userData.subscription_end,
        customer_id: userData.customer_id,
        updated_at: userData.updated_at,
      },
    })
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 })
  }
}
