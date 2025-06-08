import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, ilike, and, or, count, desc, isNull, isNotNull } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const chapterId = searchParams.get("chapterId")
    const status = searchParams.get("status")
    const splitCode = searchParams.get("splitCode")

    const offset = (page - 1) * limit
    const db = getDbConnection()

    // Build where conditions
    const whereConditions = []

    if (chapterId && chapterId !== "all") {
      whereConditions.push(eq(registrations.chapterId, Number.parseInt(chapterId)))
    }

    if (status && status !== "all") {
      whereConditions.push(eq(registrations.paymentStatus, status as "pending" | "completed"))
    }

    if (splitCode && splitCode !== "all") {
      if (splitCode === "with_split_code") {
        whereConditions.push(isNotNull(registrations.splitCodeUsed))
      } else if (splitCode === "without_split_code") {
        whereConditions.push(isNull(registrations.splitCodeUsed))
      }
    }

    if (search) {
      whereConditions.push(
        or(
          ilike(registrations.firstName, `%${search}%`),
          ilike(registrations.lastName, `%${search}%`),
          ilike(registrations.registrationNumber, `%${search}%`),
        ),
      )
    }

    // Get registrations with filters
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(whereClause)
    
    const total = totalResult[0].count
    const totalPages = Math.ceil(total / limit)

    const allRegistrations = await db.query.registrations.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(registrations.createdAt)],
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    // Transform the data to match frontend expectations
    const transformedRegistrations = allRegistrations.map(reg => ({
      id: reg.id,
      registrationNumber: reg.registrationNumber,
      firstName: reg.firstName,
      middleName: reg.middleName,
      lastName: reg.lastName,
      chapterId: reg.chapterId,
      chapterName: reg.chapter?.name || 'Unknown Chapter',
      schoolId: reg.schoolId,
      schoolName: reg.school?.name || reg.schoolName || 'Unknown School',
      paymentStatus: reg.paymentStatus,
      splitCodeUsed: reg.splitCodeUsed,
      paymentReference: reg.paymentReference,
      createdAt: reg.createdAt,
    }))

    return NextResponse.json({
      registrations: transformedRegistrations,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
