import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 })
    }

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error in Google Maps config API:", error)
    return NextResponse.json({ error: "Failed to retrieve Google Maps configuration" }, { status: 500 })
  }
}
