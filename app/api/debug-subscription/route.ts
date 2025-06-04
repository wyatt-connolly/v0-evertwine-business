import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
  }

  try {
    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    console.log(`🔍 Checking subscription for user: ${userId}`)

    // Use Firebase Admin SDK methods (not client SDK)
    const userDocRef = db.collection("business_users").doc(userId)
    const userDoc = await userDocRef.get()

    if (!userDoc.exists) {
      console.log(`❌ User document not found: ${userId}`)
      return NextResponse.json(
        {
          error: "User not found",
          userId,
          collection: "business_users",
          suggestion: "User document does not exist in Firestore",
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
      plan: userData.plan, // Added plan to debug output
    })

    // Calculate subscription status using the same logic as auth context
    const isActiveByStatus = userData.subscription_status === "active"
    const isActiveByDate = subscriptionEnd ? subscriptionEnd > now : false
    const shouldBeActive = isActiveByStatus && isActiveByDate

    // Check for boolean fields (if they exist)
    const hasBooleanFields = userData.is_subscribed !== undefined || userData.subscription_active !== undefined
    const booleanResult = userData.is_subscribed === true || userData.subscription_active === true

    // Plan analysis
    const planAnalysis = {
      currentPlan: userData.plan || "unknown",
      isFreePlan: userData.plan === "free",
      isPaidPlan: userData.plan === "premium" || userData.plan === "business",
      planFeatures: getPlanFeatures(userData.plan),
      shouldHaveAccess: shouldBeActive || userData.plan === "premium" || userData.plan === "business",
    }

    return NextResponse.json({
      success: true,
      debug: {
        userId,
        currentTime: now.toISOString(),
        timestamp: now.getTime(),

        // Plan Analysis
        planAnalysis,

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
          plan: userData.plan, // Include plan in raw data
          promotions_used: userData.promotions_used,
          promotions_limit: userData.promotions_limit,
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
          planIssues: [
            !userData.plan && "Missing plan field",
            userData.plan === "free" && !shouldBeActive && "User on free plan without active subscription",
            userData.plan !== "free" && !shouldBeActive && "User on paid plan but subscription not active",
          ].filter(Boolean),
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
          "Update plan field when subscription changes",
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
        troubleshooting: {
          testFirebaseAdmin: "/api/test-firebase-admin",
          commonCauses: [
            "Firebase Admin SDK not properly initialized",
            "Environment variables missing or incorrect",
            "Private key format issues",
            "Firestore permissions",
          ],
        },
      },
      { status: 500 },
    )
  }
}

// Helper function to get plan features
function getPlanFeatures(plan: string) {
  switch (plan) {
    case "free":
      return {
        promotions_limit: 2,
        analytics: false,
        priority_support: false,
        custom_branding: false,
      }
    case "premium":
    case "business":
      return {
        promotions_limit: "unlimited",
        analytics: true,
        priority_support: true,
        custom_branding: true,
      }
    default:
      return {
        promotions_limit: 2,
        analytics: false,
        priority_support: false,
        custom_branding: false,
      }
  }
}
