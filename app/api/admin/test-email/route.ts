import { NextResponse } from "next/server"
import { testEmailConnection } from "@/lib/email-new"

export async function GET() {
  try {
    const result = await testEmailConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing email connection:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
