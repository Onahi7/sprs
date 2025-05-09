import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // In a real implementation, this would check against a database of admin users
    // For this example, we'll use a hardcoded admin user
    const isValid = username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD;
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create a JWT token
    const token = sign(
      { 
        username, 
        role: "admin"
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      { expiresIn: "24h" }
    );
    
    // Set the token in a cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response
  } catch (error) {
    console.error("Error logging in admin:", error)
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 })
  }
}
