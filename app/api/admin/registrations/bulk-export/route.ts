import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations, chapters, schools, centers, chapterCoordinators } from "@/db/schema"
import { eq, ilike, and, or, inArray } from "drizzle-orm"

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { registrationIds } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    const db = getDbConnection()

    // Get the registrations to export
    const registrationsToExport = await db.query.registrations.findMany({
      where: inArray(registrations.id, registrationIds),
      with: {
        chapter: true,
        school: true,
        center: true,
        coordinatorRegisteredBy: true,
      },
      orderBy: [registrations.createdAt]
    })

    // Convert to CSV format
    const csvHeaders = [
      "Registration Number",
      "First Name",
      "Middle Name", 
      "Last Name",
      "Chapter",
      "School",
      "Center",
      "Parent First Name",
      "Parent Last Name",
      "Parent Phone",
      "Parent Email",
      "Payment Status",
      "Split Code Used",
      "Payment Reference",
      "Registration Type",
      "Registered By Coordinator",
      "Created Date"
    ]

    const csvData = registrationsToExport.map(reg => [
      reg.registrationNumber,
      reg.firstName,
      reg.middleName || "",
      reg.lastName,
      reg.chapter?.name || "Unknown",
      reg.school?.name || reg.schoolName || "Unknown",
      reg.center?.name || "Not Assigned",
      reg.parentFirstName,
      reg.parentLastName,
      reg.parentPhone,
      reg.parentEmail,
      reg.paymentStatus,
      reg.splitCodeUsed || "N/A",
      reg.paymentReference || "N/A",
      reg.registrationType || "public",
      reg.coordinatorRegisteredBy?.name || "N/A",
      reg.createdAt?.toISOString().split('T')[0] || ""
    ])

    // Create CSV content
    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map(row => 
        row.map(field => 
          // Escape fields that contain commas, quotes, or newlines
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(",")
      )
    ].join("\n")

    // Return CSV as response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error("Error in bulk export:", error)
    return NextResponse.json(
      { error: "Failed to export registrations" },
      { status: 500 }
    )
  }
}
