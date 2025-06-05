import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations } from "@/db/schema"
import { eq, ilike, and, or, desc, count, type SQL } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    
    const chapterId = session.chapterId
    
    if (!chapterId) {
      return NextResponse.json({ error: "No chapter assigned to coordinator" }, { status: 400 })
    }

    const offset = (page - 1) * limit
    const db = getDbConnection()

    // Build the WHERE condition
    const whereConditions: SQL[] = [eq(registrations.chapterId, chapterId)]
    
    if (search) {
      const searchCondition = or(
        ilike(registrations.firstName, `%${search}%`),
        ilike(registrations.lastName, `%${search}%`),
        ilike(registrations.registrationNumber, `%${search}%`)
      )
      if (searchCondition) whereConditions.push(searchCondition)
    }

    const whereCondition = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]

    // Get registrations with filters
    const allRegistrations = await db.query.registrations.findMany({
      where: whereCondition,
      limit,
      offset,
      orderBy: [desc(registrations.createdAt)],
      with: {
        school: true,
      },
    })

    // Get total count for pagination
    const totalCountResult = await db.select({ count: count() }).from(registrations).where(whereCondition)

    return NextResponse.json({
      registrations: allRegistrations,
      pagination: {
        total: totalCountResult[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalCountResult[0].count / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
