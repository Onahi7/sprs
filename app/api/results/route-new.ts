import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { studentResults, registrations, subjects, chapters, centers, resultEntryUsers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const centerId = searchParams.get("centerId")
    const registrationNumber = searchParams.get("registrationNumber")
    const subjectId = searchParams.get("subjectId")

    // Handle public result lookup by registration number (for students)
    if (registrationNumber && !chapterId && !centerId) {
      // Apply rate limiting for public lookups
      const clientIP = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown"
      
      const rateLimitResult = checkRateLimit(clientIP)
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." }, 
          { status: 429 }
        )
      }

      // For public access, verify registration exists
      const registration = await db
        .select()
        .from(registrations)
        .where(eq(registrations.registrationNumber, registrationNumber))
        .limit(1)

      if (registration.length === 0) {
        return NextResponse.json({ error: "Registration not found" }, { status: 404 })
      }

      // Note: Removed payment status check - results now available regardless of payment status
      // Uncomment the lines below if you want to restrict public result viewing to paid students only:
      // if (registration[0].paymentStatus !== 'completed') {
      //   return NextResponse.json(
      //     { error: "Results are only available for students who have completed payment" }, 
      //     { status: 403 }
      //   )
      // }

      // Fetch and return results for this registration
      const results = await db
        .select({
          id: studentResults.id,
          registrationId: studentResults.registrationId,
          subjectId: studentResults.subjectId,
          score: studentResults.score,
          grade: studentResults.grade,
          enteredAt: studentResults.enteredAt,
          subject: {
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
            maxScore: subjects.maxScore,
          },
        })
        .from(studentResults)
        .leftJoin(subjects, eq(studentResults.subjectId, subjects.id))
        .where(eq(studentResults.registrationId, registration[0].id))

      return NextResponse.json(results)
    }

    // Admin/Coordinator access (requires authentication)
    if (chapterId || centerId) {
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const token = authHeader.substring(7)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        
        // Verify user has access to the requested chapter/center
        if (chapterId && decoded.chapterId !== parseInt(chapterId)) {
          return NextResponse.json({ error: "Access denied to this chapter" }, { status: 403 })
        }
        if (centerId && decoded.centerId !== parseInt(centerId)) {
          return NextResponse.json({ error: "Access denied to this center" }, { status: 403 })
        }
      } catch (error) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    // Build query for authenticated access
    const baseQuery = db
      .select({
        id: studentResults.id,
        registrationId: studentResults.registrationId,
        subjectId: studentResults.subjectId,
        score: studentResults.score,
        grade: studentResults.grade,
        enteredAt: studentResults.enteredAt,
        updatedAt: studentResults.updatedAt,
        registration: {
          id: registrations.id,
          registrationNumber: registrations.registrationNumber,
          firstName: registrations.firstName,
          middleName: registrations.middleName,
          lastName: registrations.lastName,
          centerId: registrations.centerId,
          centerName: centers.name,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
          maxScore: subjects.maxScore,
        },
        chapter: {
          id: chapters.id,
          name: chapters.name,
        },
        enteredBy: {
          id: resultEntryUsers.id,
          name: resultEntryUsers.name,
          username: resultEntryUsers.username,
        },
      })
      .from(studentResults)
      .leftJoin(registrations, eq(studentResults.registrationId, registrations.id))
      .leftJoin(subjects, eq(studentResults.subjectId, subjects.id))
      .leftJoin(chapters, eq(registrations.chapterId, chapters.id))
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(resultEntryUsers, eq(studentResults.enteredBy, resultEntryUsers.id))

    const filters = []
    if (chapterId) {
      filters.push(eq(registrations.chapterId, parseInt(chapterId)))
    }
    if (centerId) {
      filters.push(eq(registrations.centerId, parseInt(centerId)))
    }
    if (registrationNumber) {
      filters.push(eq(registrations.registrationNumber, registrationNumber))
    }
    if (subjectId) {
      filters.push(eq(studentResults.subjectId, parseInt(subjectId)))
    }

    const results = filters.length > 0 
      ? await baseQuery.where(and(...filters))
      : await baseQuery

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching student results:", error)
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Handle bulk operations
    if (body.results && Array.isArray(body.results)) {
      const results = body.results
      const savedResults = []

      for (const result of results) {
        const { registrationId, subjectId, score, grade } = result

        if (!registrationId || !subjectId || score === undefined) {
          continue // Skip invalid entries
        }

        // Calculate grade if not provided
        const calculatedGrade = grade || calculateGrade(score, 100) // Assuming max score 100, adjust as needed

        // Check if result already exists
        const existingResult = await db
          .select()
          .from(studentResults)
          .where(
            and(
              eq(studentResults.registrationId, registrationId),
              eq(studentResults.subjectId, subjectId)
            )
          )
          .limit(1)

        if (existingResult.length > 0) {
          // Update existing result
          const updated = await db
            .update(studentResults)
            .set({
              score,
              grade: calculatedGrade,
              enteredBy: decoded.userId,
              updatedAt: new Date(),
            })
            .where(eq(studentResults.id, existingResult[0].id))
            .returning()

          savedResults.push(updated[0])
        } else {
          // Create new result
          const created = await db
            .insert(studentResults)
            .values({
              registrationId,
              subjectId,
              score,
              grade: calculatedGrade,
              enteredBy: decoded.userId,
            })
            .returning()

          savedResults.push(created[0])
        }
      }

      return NextResponse.json({
        message: `Saved ${savedResults.length} results`,
        results: savedResults,
      })
    }

    // Handle single result
    const { registrationId, subjectId, score, grade } = body

    if (!registrationId || !subjectId || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const calculatedGrade = grade || calculateGrade(score, 100)

    // Check if result already exists
    const existingResult = await db
      .select()
      .from(studentResults)
      .where(
        and(
          eq(studentResults.registrationId, registrationId),
          eq(studentResults.subjectId, subjectId)
        )
      )
      .limit(1)

    let savedResult

    if (existingResult.length > 0) {
      // Update existing result
      const updated = await db
        .update(studentResults)
        .set({
          score,
          grade: calculatedGrade,
          enteredBy: decoded.userId,
          updatedAt: new Date(),
        })
        .where(eq(studentResults.id, existingResult[0].id))
        .returning()

      savedResult = updated[0]
    } else {
      // Create new result
      const created = await db
        .insert(studentResults)
        .values({
          registrationId,
          subjectId,
          score,
          grade: calculatedGrade,
          enteredBy: decoded.userId,
        })
        .returning()

      savedResult = created[0]
    }

    return NextResponse.json(savedResult)
  } catch (error) {
    console.error("Error saving student result:", error)
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    try {
      jwt.verify(token, process.env.JWT_SECRET!)
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "Result ID is required" },
        { status: 400 }
      )
    }

    await db.delete(studentResults).where(eq(studentResults.id, id))

    return NextResponse.json({ message: "Result deleted successfully" })
  } catch (error) {
    console.error("Error deleting student result:", error)
    return NextResponse.json(
      { error: "Failed to delete result" },
      { status: 500 }
    )
  }
}

// Helper function to calculate grade based on score and max score
function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B"
  if (percentage >= 60) return "C"
  if (percentage >= 50) return "D"
  if (percentage >= 40) return "E"
  return "F"
}
