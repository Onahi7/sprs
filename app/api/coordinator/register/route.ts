import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth" 
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { sendRegistrationConfirmationEmail } from "@/lib/email"
import { getDbConnection } from "@/db/utils"
import { 
  useCoordinatorSlots, 
  validateCoordinatorRegistration,
  getRealtimeSlotBalance 
} from "@/db/coordinator-slots-utils"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const data = await request.json()
    const db = getDbConnection()

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName", 
      "chapterId",
      "centerId",
      "parentFirstName",
      "parentLastName",
      "parentEmail",
      "parentPhone",
      "parentConsent",
      "passportUrl",
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate that either schoolId or schoolName is provided
    if (!data.schoolId && !data.schoolName) {
      return NextResponse.json({ error: "Either schoolId or schoolName is required" }, { status: 400 })
    }    // Validate coordinator has sufficient slots
    const coordinatorId = session.id!
    const slotValidation = await validateCoordinatorRegistration(coordinatorId, 1)
    
    if (!slotValidation.canRegister) {
      return NextResponse.json({ 
        error: slotValidation.message,
        code: "INSUFFICIENT_SLOTS",
        availableSlots: slotValidation.availableSlots || 0
      }, { status: 400 })
    }

    // Optional: Log if this registration was made after duplicate confirmation
    const duplicateOverride = data.duplicateConfirmed === true
    if (duplicateOverride) {
      console.log(`🔄 Registration proceeding after duplicate confirmation for ${data.firstName} ${data.lastName} by coordinator ${coordinatorId}`)
    }

    // Generate registration number - Format: NAPPS-XXXXXXYY (X=timestamp digits, Y=random letters)
    const registrationNumber = `NAPPS-${Date.now().toString().slice(-6)}${nanoid(2).toUpperCase()}`

    // Handle school resolution and auto-creation
    let schoolId = data.schoolId
    let schoolName = data.schoolName

    if (data.schoolId && !schoolName) {
      // Case 1: schoolId provided, get school name from database
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, data.schoolId),
      })
      schoolName = school?.name || null
    } else if (!data.schoolId && schoolName) {
      // Case 2: schoolName provided manually, check if school already exists for this chapter
      const existingSchool = await db.query.schools.findFirst({
        where: and(
          eq(schools.chapterId, data.chapterId),
          eq(schools.name, schoolName.trim())
        ),
      })

      if (existingSchool) {
        // School already exists, use it
        schoolId = existingSchool.id
      } else {
        // School doesn't exist, create it
        const newSchoolResult = await db.insert(schools).values({
          chapterId: data.chapterId,
          name: schoolName.trim(),
          createdAt: new Date(),
        }).returning()
        
        schoolId = newSchoolResult[0].id
        console.log(`✅ Auto-created school "${schoolName}" for chapter ${data.chapterId}`)
      }
    }    // Insert registration with coordinator-specific fields
    const result = await db.insert(registrations).values({
      registrationNumber,
      firstName: data.firstName,
      middleName: data.middleName || null,
      lastName: data.lastName,
      chapterId: data.chapterId,
      schoolId: schoolId,
      schoolName: schoolName,
      centerId: data.centerId,
      parentFirstName: data.parentFirstName,
      parentLastName: data.parentLastName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      parentConsent: data.parentConsent,
      passportUrl: data.passportUrl,
      paymentStatus: "completed", // Paid via slot system
      coordinatorRegisteredBy: coordinatorId,
      registrationType: "coordinator",
      createdAt: new Date(),
    }).returning()

    const newRegistration = result[0]

    // Use coordinator slot for this registration
    const slotUsage = await useCoordinatorSlots(
      coordinatorId, 
      newRegistration.id, 
      1, 
      'registration',
      `Registration for ${data.firstName} ${data.lastName} (${registrationNumber})`
    )

    if (!slotUsage.success) {
      // If slot deduction fails, we need to rollback the registration
      // Note: In a production environment, this should be a database transaction
      await db.delete(registrations).where(eq(registrations.id, newRegistration.id))
      
      return NextResponse.json({ 
        error: "Failed to deduct slot: " + slotUsage.message,
        code: "SLOT_DEDUCTION_FAILED"
      }, { status: 500 })
    }

    // Get chapter, school, and center details for email
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, data.chapterId),
    })

    const center = await db.query.centers.findFirst({
      where: eq(centers.id, data.centerId),
    })

    // Send registration confirmation email
    try {
      await sendRegistrationConfirmationEmail({
        to: data.parentEmail,
        name: `${data.firstName} ${data.lastName}`,
        registrationNumber,
        chapter: chapter?.name || `Chapter ID: ${data.chapterId}`,
        school: schoolName || `School ID: ${data.schoolId}`,
        center: center?.name || `Center ID: ${data.centerId}`,
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
      // Don't fail the registration if email sending fails
    }

    // Get updated slot balance for response
    const updatedBalance = await getRealtimeSlotBalance(coordinatorId)

    return NextResponse.json({
      success: true,
      id: newRegistration.id,
      registrationNumber,
      message: "Student registered successfully using coordinator slot",
      slotInfo: {
        slotsUsed: 1,
        remainingSlots: slotUsage.remainingSlots,
        updatedBalance: updatedBalance.success ? updatedBalance : null
      }
    })
  } catch (error) {
    console.error("Coordinator registration error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const db = getDbConnection()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters with defaults
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10")))
    const offset = (page - 1) * limit
    const search = searchParams.get("search")?.trim()
    const centerId = searchParams.get("centerId")
    const schoolId = searchParams.get("schoolId") 
    const paymentStatus = searchParams.get("paymentStatus")
    const sortBy = searchParams.get("sortBy") || "newest"
    const isExport = searchParams.get("export") === "true"
    
    const coordinatorId = session.id!

    // Build where conditions
    const conditions = [eq(registrations.coordinatorRegisteredBy, coordinatorId)]
      // Add search filter (name or registration number)
    if (search) {
      const { ilike, or } = await import("drizzle-orm")
      const searchCondition = or(
        ilike(registrations.firstName, `%${search}%`),
        ilike(registrations.lastName, `%${search}%`),
        ilike(registrations.registrationNumber, `%${search}%`)
      )
      if (searchCondition) {
        conditions.push(searchCondition)
      }
    }
    
    // Add center filter
    if (centerId && centerId !== "all") {
      conditions.push(eq(registrations.centerId, Number.parseInt(centerId)))
    }    // Add school filter 
    if (schoolId && schoolId !== "all") {
      if (schoolId.startsWith("manual_")) {
        // Handle manual school names
        const schoolName = schoolId.replace("manual_", "")
        conditions.push(eq(registrations.schoolName, schoolName))
      } else {
        // Handle regular school IDs
        conditions.push(eq(registrations.schoolId, Number.parseInt(schoolId)))
      }
    }
    
    // Add payment status filter
    if (paymentStatus && paymentStatus !== "all") {
      conditions.push(eq(registrations.paymentStatus, paymentStatus as "pending" | "completed"))
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

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

    if (isExport) {      // For export, get all matching records without pagination
      const allRegistrations = await db.query.registrations.findMany({
        where: whereClause,
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

    // Get total count for pagination
    const { count } = await import("drizzle-orm")
    const totalResult = await db.select({ count: count() }).from(registrations).where(whereClause)
    const total = totalResult[0]?.count || 0    // Get paginated registrations
    const coordinatorRegistrations = await db.query.registrations.findMany({
      limit,
      offset,
      where: whereClause,
      orderBy,
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })    // Get current slot balance
    const slotBalance = await getRealtimeSlotBalance(coordinatorId)

    return NextResponse.json({
      registrations: coordinatorRegistrations,
      slotBalance: slotBalance.success ? slotBalance : null,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("Error fetching coordinator registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
