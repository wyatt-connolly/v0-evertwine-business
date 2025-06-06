import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("Google Maps API key not found in environment variables")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Return the API key
    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error in Google Maps config API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
