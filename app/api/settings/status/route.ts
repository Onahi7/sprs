import { NextResponse } from "next/server"
import { getSystemSettings } from "@/lib/settings"

export async function GET() {
  try {
    const settings = await getSystemSettings()
    
    return NextResponse.json({
      registrationEnabled: settings.registrationEnabled,
      paymentEnabled: settings.paymentEnabled
    })
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    )
  }
}
