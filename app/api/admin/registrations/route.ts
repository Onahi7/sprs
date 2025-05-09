import { NextResponse } from "next/server"
import { db } from "@/db"
import { registrations } from "@/db/schema"
import { eq, like, and, or, desc, type SQL, sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const chapterId = searchParams.get("chapterId")
    const status = searchParams.get("status")

    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: SQL[] = []

    if (chapterId && chapterId !== "all") {
      whereConditions.push(eq(registrations.chapterId, Number.parseInt(chapterId)))
    }

    if (status && status !== "all") {
      whereConditions.push(eq(registrations.paymentStatus, status))
    }

    if (search) {
      whereConditions.push(
        or(
          like(registrations.firstName, `%${search}%`),
          like(registrations.lastName, `%${search}%`),
          like(registrations.registrationNumber, `%${search}%`),
        ),
      )
    }

    // Get registrations with filters
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const allRegistrations = await db.query.registrations.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(registrations.createdAt)],
      with: {
        chapter: true,
        school: true,
      },
    })

    // Get total count for pagination
    const countQuery = db.select({ count: sql<number>`count(*)` }).from(registrations)
    if (whereClause) {
      countQuery.where(whereClause)
    }
    const totalCount = await countQuery

    return NextResponse.json({
      registrations: allRegistrations,
      pagination: {
        total: totalCount[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
