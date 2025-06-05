import { NextResponse } from "next/server"

export async function GET() {
  // Only return template and instructions - no sensitive data
  const emailTemplate = `
    <!-- HTML email template content only -->
  `

  return NextResponse.json({
    success: true,
    template: emailTemplate,
    instructions: "Setup instructions for Firebase Console",
  })
}
