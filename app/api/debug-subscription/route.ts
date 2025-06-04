import { type NextRequest, NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
  }

  try {
    // Ensure we have a valid Firebase admin instance
    if (!db) {
      console.error("Firebase admin not initialized")
      return NextResponse.json(
        {
          error: "Firebase admin not available",
          details: "Server configuration issue",
        },
        { status: 500 },
      )
    }

    console.log(`🔍 Checking subscription for user: ${userId}`)

    const userDoc = await getDoc(doc(db, "business_users", userId))

    if (!userDoc.exists()) {
      console.log(`❌ User document not found: ${userId}`)
      return NextResponse.json(
        {
          error: "User not found",
          userId,
          collection: "business_users",
        },
        { status: 404 },
      )
    }

    const userData = userDoc.data()
    const now = new Date()
    const subscriptionEnd = userData.subscription_end ? new Date(userData.subscription_end) : null

    console.log(`📊 User data retrieved:`, {
      subscription_status: userData.subscription_status,
      subscription_end: userData.subscription_end,
      subscription_id: userData.subscription_id,
    })

    // Calculate subscription status using the same logic as auth context
    const isActiveByStatus = userData.subscription_status === "active"
    const isActiveByDate = subscriptionEnd ? subscriptionEnd > now : false
    const shouldBeActive = isActiveByStatus && isActiveByDate

    // Check for boolean fields (if they exist)
    const hasBooleanFields = userData.is_subscribed !== undefined || userData.subscription_active !== undefined
    const booleanResult = userData.is_subscribed === true || userData.subscription_active === true

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        currentTime: now.toISOString(),
        timestamp: now.getTime(),

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

        // Boolean Fields Check
        booleanFields: {
          exists: hasBooleanFields,
          is_subscribed: userData.is_subscribed,
          subscription_active: userData.subscription_active,
          booleanResult: booleanResult,
          recommendUseBooleans: true,
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
          // Include boolean fields if they exist
          ...(userData.is_subscribed !== undefined && { is_subscribed: userData.is_subscribed }),
          ...(userData.subscription_active !== undefined && { subscription_active: userData.subscription_active }),
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
            !hasBooleanFields &&
              "Consider adding boolean fields (is_subscribed, subscription_active) for better performance",
          ].filter(Boolean),
        },

        // Recommendations
        recommendations: [
          "Add boolean fields (is_subscribed, subscription_active) to user documents",
          "Update webhooks to set boolean fields when subscription changes",
          "Use boolean fields in auth context for faster subscription checks",
          "Keep date-based fields for detailed subscription management",
        ],
      },
    })
  } catch (error) {
    console.error("❌ Error checking subscription:", error)
    return NextResponse.json(
      {
        error: "Failed to check subscription",
        details: error.message,
        stack: error.stack,
        userId,
        firebaseAdminAvailable: !!db,
      },
      { status: 500 },
    )
  }
}
