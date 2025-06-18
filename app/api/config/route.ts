import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔧 Config API called")

    const config = {
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    }

    console.log("🔍 Environment check:", {
      hasGoogleMaps: !!config.googleMapsApiKey,
    })

    if (!config.googleMapsApiKey) {
      console.error("❌ Missing Google Maps API Key")
      return NextResponse.json(
        {
          error: "Google Maps API Key not configured",
          success: false,
        },
        { status: 500 },
      )
    }

    console.log("✅ Configuration complete and valid")
    return NextResponse.json({
      ...config,
      success: true,
    })
  } catch (error) {
    console.error("❌ Error in config API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch configuration",
        details: error.message,
        success: false,
      },
      { status: 500 },
    )
  }
}
