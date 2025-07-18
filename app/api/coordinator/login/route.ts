import { NextResponse } from "next/server"
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const db = getDbConnection();

    if (!code) {
      return NextResponse.json({ error: "Coordinator code is required" }, { status: 400 })
    }

    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.uniqueCode, code),
      with: {
        chapter: true,
      },
    })

    if (!coordinator) {
      return NextResponse.json({ error: "Invalid coordinator code" }, { status: 401 })
    }

    // Create a JWT token
    const token = sign(
      { 
        id: coordinator.id, 
        role: "coordinator",
        chapterId: coordinator.chapterId,
        email: coordinator.email,
        name: coordinator.name
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      { expiresIn: "24h" }
    );
    
    // Set the token in a cookie - await cookies() call
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      coordinator: {
        id: coordinator.id,
        name: coordinator.name,
        email: coordinator.email,
        chapterId: coordinator.chapterId,
        chapterName: coordinator.chapter?.name || 'Unknown Chapter',
      },
    })
  } catch (error) {
    console.error("Error logging in coordinator:", error)
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 })
  }
}
