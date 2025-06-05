import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { resultEntryUsers, chapters } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const users = await db
      .select({
        id: resultEntryUsers.id,
        username: resultEntryUsers.username,
        name: resultEntryUsers.name,
        email: resultEntryUsers.email,
        chapterId: resultEntryUsers.chapterId,
        chapterName: chapters.name,
        isActive: resultEntryUsers.isActive,
        createdAt: resultEntryUsers.createdAt,
      })
      .from(resultEntryUsers)
      .leftJoin(chapters, eq(resultEntryUsers.chapterId, chapters.id))
      .where(eq(resultEntryUsers.isActive, true))
      .orderBy(resultEntryUsers.name)

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching result entry users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const body = await request.json()
    const { username, password, name, email, chapterId } = body

    if (!username || !password || !name || !chapterId) {
      return NextResponse.json(
        { error: "Username, password, name, and chapter are required" },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db
      .select()
      .from(resultEntryUsers)
      .where(eq(resultEntryUsers.username, username))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db
      .insert(resultEntryUsers)
      .values({
        username,
        password: hashedPassword,
        name,
        email,
        chapterId: parseInt(chapterId),
      })
      .returning()

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser[0]
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Error creating result entry user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
