import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Clear the auth token cookie with proper settings
    const response = NextResponse.json({ success: true })
    
    // Set cookie with expired date to ensure it's cleared
    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/"
    })
    
    return response
  } catch (error) {
    console.error("Error logging out:", error)
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 })
  }
}
