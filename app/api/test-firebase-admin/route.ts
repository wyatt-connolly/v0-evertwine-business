import { type NextRequest, NextResponse } from "next/server"
import { getApps } from "firebase-admin/app"

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
        exists: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
      },
      FIREBASE_CLIENT_EMAIL: {
        exists: !!process.env.FIREBASE_CLIENT_EMAIL,
        value: process.env.FIREBASE_CLIENT_EMAIL
          ? `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...`
          : "missing",
      },
      FIREBASE_PRIVATE_KEY: {
        exists: !!process.env.FIREBASE_PRIVATE_KEY,
        length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasBeginMarker: process.env.FIREBASE_PRIVATE_KEY?.includes("-----BEGIN PRIVATE KEY-----") || false,
        hasEndMarker: process.env.FIREBASE_PRIVATE_KEY?.includes("-----END PRIVATE KEY-----") || false,
        hasEscapedNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes("\\n") || false,
        preview: process.env.FIREBASE_PRIVATE_KEY
          ? `${process.env.FIREBASE_PRIVATE_KEY.substring(0, 50)}...`
          : "missing",
      },
    }

    // Check Firebase Admin apps
    const apps = getApps()
    const adminStatus = {
      appsInitialized: apps.length,
      appNames: apps.map((app) => app.name),
    }

    // Try to import and test the db
    let dbStatus = "unknown"
    let dbError = null

    try {
      const { db } = await import("@/lib/firebase-admin")

      // Test if db is accessible
      if (db && typeof db === "object") {
        dbStatus = "available"

        // Try a simple operation
        try {
          // This will throw if db is the error proxy
          const testCollection = db.collection("test")
          dbStatus = "functional"
        } catch (testError) {
          dbStatus = "error_proxy"
          dbError = testError.message
        }
      } else {
        dbStatus = "not_available"
      }
    } catch (importError) {
      dbStatus = "import_failed"
      dbError = importError.message
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      firebaseAdmin: adminStatus,
      database: {
        status: dbStatus,
        error: dbError,
      },
      recommendations: [
        !envCheck.NEXT_PUBLIC_FIREBASE_PROJECT_ID.exists && "Set NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        !envCheck.FIREBASE_CLIENT_EMAIL.exists && "Set FIREBASE_CLIENT_EMAIL",
        !envCheck.FIREBASE_PRIVATE_KEY.exists && "Set FIREBASE_PRIVATE_KEY",
        !envCheck.FIREBASE_PRIVATE_KEY.hasBeginMarker && "FIREBASE_PRIVATE_KEY missing BEGIN marker",
        !envCheck.FIREBASE_PRIVATE_KEY.hasEndMarker && "FIREBASE_PRIVATE_KEY missing END marker",
        envCheck.FIREBASE_PRIVATE_KEY.hasEscapedNewlines &&
          "FIREBASE_PRIVATE_KEY has escaped newlines (this is correct)",
        adminStatus.appsInitialized === 0 && "No Firebase Admin apps initialized",
        dbStatus === "error_proxy" && "Database is in error state - check initialization",
      ].filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
