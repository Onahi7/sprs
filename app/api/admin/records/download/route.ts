import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { registrations, chapters, centers, schools } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { formatDate } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error("Database connection not available")
    }    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const centerId = searchParams.get("centerId")
    const format = searchParams.get("format") || "csv"

    let query = db
      .select({
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        chapterName: chapters.name,
        schoolName: registrations.schoolName,
        centerName: centers.name,
        parentFirstName: registrations.parentFirstName,
        parentLastName: registrations.parentLastName,
        parentPhone: registrations.parentPhone,
        parentEmail: registrations.parentEmail,
        paymentStatus: registrations.paymentStatus,
        paymentReference: registrations.paymentReference,
        createdAt: registrations.createdAt,
      })
      .from(registrations)
      .leftJoin(chapters, eq(registrations.chapterId, chapters.id))
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))

    // Build filters
    const filters = []
    if (chapterId) {
      filters.push(eq(registrations.chapterId, parseInt(chapterId)))
    }
    if (centerId) {
      filters.push(eq(registrations.centerId, parseInt(centerId)))
    }

    // Apply filters and execute query
    const records = filters.length > 0 
      ? await query.where(and(...filters))
      : await query

    if (format === "json") {
      return NextResponse.json(records)
    }

    // Generate CSV
    const csvHeaders = [
      "Registration Number",
      "First Name",
      "Middle Name",
      "Last Name",
      "Chapter",
      "School Name",
      "Center",
      "Parent First Name",
      "Parent Last Name",
      "Parent Phone",
      "Parent Email",
      "Payment Status",
      "Payment Reference",
      "Registration Date"
    ]

    const csvRows = records.map(record => [
      record.registrationNumber,
      record.firstName,
      record.middleName || "",
      record.lastName,
      record.chapterName || "",
      record.schoolName || "",
      record.centerName || "",
      record.parentFirstName,
      record.parentLastName,
      record.parentPhone,
      record.parentEmail,
      record.paymentStatus || "",
      record.paymentReference || "",
      formatDate(record.createdAt?.toString() || "")
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    const filename = `registrations_${chapterId ? `chapter_${chapterId}_` : ""}${centerId ? `center_${centerId}_` : ""}${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error("Error downloading records:", error)
    return NextResponse.json(
      { error: "Failed to download records" },
      { status: 500 }
    )
  }
}
