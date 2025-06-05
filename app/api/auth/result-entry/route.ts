import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { resultEntryUsers, chapters } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Find user with chapter information
    const user = await db
      .select({
        id: resultEntryUsers.id,
        username: resultEntryUsers.username,
        password: resultEntryUsers.password,
        name: resultEntryUsers.name,
        email: resultEntryUsers.email,
        chapterId: resultEntryUsers.chapterId,
        chapterName: chapters.name,
        isActive: resultEntryUsers.isActive,
      })
      .from(resultEntryUsers)
      .leftJoin(chapters, eq(resultEntryUsers.chapterId, chapters.id))
      .where(
        and(
          eq(resultEntryUsers.username, username),
          eq(resultEntryUsers.isActive, true)
        )
      )
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const userData = user[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: userData.id,
        username: userData.username,
        chapterId: userData.chapterId,
        role: "result_entry",
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    })
  } catch (error) {
    console.error("Error authenticating result entry user:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
