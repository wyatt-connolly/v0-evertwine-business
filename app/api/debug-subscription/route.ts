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

    // Calculate subscription status using the same logic as auth context
    const isActiveByStatus = userData.subscription_status === "active"
    const isActiveByDate = subscriptionEnd ? subscriptionEnd > now : false
    const shouldBeActive = isActiveByStatus && isActiveByDate

    return NextResponse.json({
      debug: {
        userId,
        currentTime: now.toISOString(),

        // Subscription Analysis
        subscriptionAnalysis: {
          status: userData.subscription_status,
          hasValidStatus: isActiveByStatus,
          endDate: userData.subscription_end,
          endDateParsed: subscriptionEnd?.toISOString(),
          isEndDateInFuture: isActiveByDate,
          finalResult: shouldBeActive,
          daysUntilExpiry: subscriptionEnd
            ? Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },

        // Raw Firebase Data
        rawUserData: {
          subscription_status: userData.subscription_status,
          subscription_start: userData.subscription_start,
          subscription_end: userData.subscription_end,
          subscription_id: userData.subscription_id,
          customer_id: userData.customer_id,
          updated_at: userData.updated_at,
          created_at: userData.created_at,
          email: userData.email,
          name: userData.name,
          plan: userData.plan,
        },

        // Troubleshooting
        troubleshooting: {
          hasSubscriptionId: !!userData.subscription_id,
          hasCustomerId: !!userData.customer_id,
          hasEndDate: !!userData.subscription_end,
          statusIsActive: userData.subscription_status === "active",
          endDateIsValid: subscriptionEnd instanceof Date && !isNaN(subscriptionEnd.getTime()),
          endDateInFuture: subscriptionEnd ? subscriptionEnd > now : false,
          possibleIssues: [
            !userData.subscription_status && "Missing subscription_status",
            userData.subscription_status !== "active" &&
              `Status is "${userData.subscription_status}" instead of "active"`,
            !userData.subscription_end && "Missing subscription_end date",
            subscriptionEnd && subscriptionEnd <= now && "Subscription end date is in the past",
            !userData.subscription_id && "Missing subscription_id",
            !userData.customer_id && "Missing customer_id",
          ].filter(Boolean),
        },
      },
    })
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to check subscription",
        details: error.message,
        userId,
      },
      { status: 500 },
    )
  }
}
