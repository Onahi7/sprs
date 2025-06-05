import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { subjects } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const body = await request.json()
    const { name, code, maxScore, minScore, isActive } = body
    const subjectId = parseInt(params.id)

    const updatedSubject = await db
      .update(subjects)
      .set({
        name,
        code: code?.toUpperCase(),
        maxScore,
        minScore,
        isActive,
      })
      .where(eq(subjects.id, subjectId))
      .returning()

    if (updatedSubject.length === 0) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedSubject[0])
  } catch (error) {
    console.error("Error updating subject:", error)
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const subjectId = parseInt(params.id)

    // Soft delete by setting isActive to false
    const deletedSubject = await db
      .update(subjects)
      .set({ isActive: false })
      .where(eq(subjects.id, subjectId))
      .returning()

    if (deletedSubject.length === 0) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: "Subject deleted successfully" })
  } catch (error) {
    console.error("Error deleting subject:", error)
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    )
  }
}
