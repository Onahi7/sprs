import { NextResponse } from "next/server"
import { db } from "@/db"
import { registrations } from "@/db/schema"
import { eq, like, and, or, desc, type SQL, sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }

    const chapterIdNum = Number.parseInt(chapterId)
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: SQL[] = [eq(registrations.chapterId, chapterIdNum)]

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
    const whereClause = and(...whereConditions)

    const allRegistrations = await db.query.registrations.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(registrations.createdAt)],
      with: {
        school: true,
      },
    })

    // Get total count for pagination
    const totalCount = await db.select({ count: sql<number>`count(*)` }).from(registrations).where(whereClause)

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
