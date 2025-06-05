import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { subjects } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const allSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(subjects.name)

    return NextResponse.json(allSubjects)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
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
    const { name, code, maxScore, minScore } = body

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      )
    }

    const newSubject = await db
      .insert(subjects)
      .values({
        name,
        code: code.toUpperCase(),
        maxScore: maxScore || 100,
        minScore: minScore || 0,
      })
      .returning()

    return NextResponse.json(newSubject[0], { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    )
  }
}
