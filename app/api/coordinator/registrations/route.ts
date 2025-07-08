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
    const isExport = searchParams.get("export") === "true"
    const centerFilter = searchParams.get("centerId")
    const schoolFilter = searchParams.get("schoolId")
    const paymentFilter = searchParams.get("paymentStatus")
    const sortBy = searchParams.get("sortBy") || "newest"
    
    // Use chapterId from session or from query params (for compatibility)
    const chapterId = session.chapterId || Number.parseInt(searchParams.get("chapterId") || "0")
    
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

    // Add center filter
    if (centerFilter && centerFilter !== "all") {
      whereConditions.push(eq(registrations.centerId, Number.parseInt(centerFilter)))
    }

    // Add school filter
    if (schoolFilter && schoolFilter !== "all") {
      if (schoolFilter.startsWith("manual_")) {
        // Handle manually entered school names
        const schoolName = schoolFilter.replace("manual_", "")
        whereConditions.push(eq(registrations.schoolName, schoolName))
      } else {
        // Handle regular school IDs
        whereConditions.push(eq(registrations.schoolId, Number.parseInt(schoolFilter)))
      }
    }

    // Add payment status filter
    if (paymentFilter && paymentFilter !== "all") {
      whereConditions.push(eq(registrations.paymentStatus, paymentFilter as "pending" | "completed"))
    }

    const whereCondition = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]

    // Determine sort order
    let orderBy
    const { asc } = await import("drizzle-orm")
    
    switch (sortBy) {
      case "oldest":
        orderBy = [asc(registrations.createdAt)]
        break
      case "name":
        orderBy = [asc(registrations.firstName), asc(registrations.lastName)]
        break
      case "regnum":
        orderBy = [asc(registrations.registrationNumber)]
        break
      case "newest":
      default:
        orderBy = [desc(registrations.createdAt)]
        break
    }

    if (isExport) {
      // For export, get all matching records without pagination
      const allRegistrations = await db.query.registrations.findMany({
        where: whereCondition,
        orderBy,
        with: {
          chapter: true,
          school: true,
          center: true,
        },
      })

      // Convert to CSV format
      const csvHeaders = [
        "Registration Number",
        "First Name", 
        "Last Name",
        "Chapter",
        "School",
        "Center", 
        "Payment Status",
        "Registration Type",
        "Registration Date"
      ]
      
      const csvRows = allRegistrations.map(reg => [
        reg.registrationNumber,
        reg.firstName,
        reg.lastName,
        reg.chapter?.name || "",
        reg.school?.name || reg.schoolName || "",
        reg.center?.name || "",
        reg.paymentStatus,
        reg.registrationType || "public",
        new Date(reg.createdAt || new Date()).toLocaleDateString()
      ])
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(","))
        .join("\n")
      
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="coordinator-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    // Get registrations with filters
    const allRegistrations = await db.query.registrations.findMany({
      where: whereCondition,
      limit,
      offset,
      orderBy,
      with: {
        school: true,
        center: true,
        chapter: true,
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
      total: totalCountResult[0].count, // For backward compatibility
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
