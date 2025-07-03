import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { registrations, centers, chapters } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    // Check authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const centerId = searchParams.get("centerId")

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }    // Build query conditions
    const conditions = [eq(registrations.chapterId, parseInt(chapterId))]
    
    if (centerId) {
      conditions.push(eq(registrations.centerId, parseInt(centerId)))
    }

    const whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0]

    // Fetch students (registrations) for the chapter/center
    const students = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        middleName: registrations.middleName,
        centerName: centers.name,
        chapterName: chapters.name,
        chapterId: registrations.chapterId,
        centerId: registrations.centerId,
        paymentStatus: registrations.paymentStatus
      })
      .from(registrations)
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(chapters, eq(registrations.chapterId, chapters.id))
      .where(whereConditions)
      .orderBy(registrations.lastName, registrations.firstName)

    // Return all students (removed payment status filter)
    // Note: This allows result entry for all students regardless of payment status
    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
