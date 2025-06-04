import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, subscriptionType = "test" } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email required" }, { status: 400 })
    }

    // Import Firebase Admin
    const { db } = await import("@/lib/firebase-admin")

    // Create test subscription data
    const now = new Date()
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

    const testUserData = {
      email: email,
      name: "Test User",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),

      // Subscription fields
      subscription_status: "active",
      subscription_start: now.toISOString(),
      subscription_end: futureDate.toISOString(),
      subscription_id: `sub_test_${Date.now()}`,
      customer_id: `cus_test_${Date.now()}`,

      // Boolean fields for better performance
      is_subscribed: true,
      subscription_active: true,

      // Test metadata
      test_data: true,
      test_type: subscriptionType,
      seeded_at: now.toISOString(),
    }

    // Update or create user document
    const { doc, setDoc } = await import("firebase-admin/firestore")
    await setDoc(doc(db, "business_users", userId), testUserData, { merge: true })

    return NextResponse.json({
      success: true,
      message: "Test subscription data created successfully",
      userId,
      data: testUserData,
      instructions: [
        "User now has an active test subscription",
        "Subscription is valid for 30 days",
        "You can test the subscription check endpoints",
        "Use /api/debug-subscription?userId=" + userId + " to verify",
      ],
    })
  } catch (error) {
    console.error("Error seeding test data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: "Make sure Firebase Admin is properly configured",
      },
      { status: 500 },
    )
  }
}
