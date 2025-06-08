import { parse } from "csv-parse/sync"

/**
 * importCSV: Minimal CSV import for chapters, schools, or centers
 * @param file File (from formData)
 * @param entityType "chapter" | "school" | "center"
 */
export async function importCSV(file: File, entityType: "chapter" | "school" | "center") {
  try {
    const text = await file.text()
    const records = parse(text, { columns: true, skip_empty_lines: true })
    // TODO: Insert records into DB based on entityType
    // For now, just return the parsed records count
    return { success: true, count: records.length, entityType }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
// CSV Import/Export
import { stringify } from "csv-stringify/sync"
import { getDbConnection } from "@/db/utils"
import { chapters, schools, centers, registrations } from "@/db/schema"
import { eq, and, gte, lte, desc, asc, isNull, isNotNull } from "drizzle-orm"

export async function exportRegistrationsToCSV(filters: {
  chapterId?: number
  status?: "pending" | "completed"
  splitCode?: string
  startDate?: Date
  endDate?: Date
}) {
  try {
    const db = getDbConnection()
    
    // Build where conditions based on filters
    const whereConditions = []
    
    if (filters.chapterId) {
      whereConditions.push(eq(registrations.chapterId, filters.chapterId))
    }
    
    if (filters.status) {
      whereConditions.push(eq(registrations.paymentStatus, filters.status))
    }
    
    if (filters.splitCode) {
      if (filters.splitCode === "with_split_code") {
        whereConditions.push(isNotNull(registrations.splitCodeUsed))
      } else if (filters.splitCode === "without_split_code") {
        whereConditions.push(isNull(registrations.splitCodeUsed))
      }
    }
    
    if (filters.startDate) {
      whereConditions.push(gte(registrations.createdAt, filters.startDate))
    }
    
    if (filters.endDate) {
      whereConditions.push(lte(registrations.createdAt, filters.endDate))
    }
    
    // Execute the query
    const results = await db.query.registrations.findMany({
      ...(whereConditions.length > 0 && { where: and(...whereConditions) }),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
      orderBy: [asc(registrations.registrationNumber)],
    })

    // Prepare data for CSV
    const csvData = results.map((reg) => ({
      "Registration Number": reg.registrationNumber,
      "First Name": reg.firstName,
      "Middle Name": reg.middleName || "",
      "Last Name": reg.lastName,
      Chapter: reg.chapter?.name || "",
      School: reg.schoolName || reg.school?.name || "",
      Center: reg.center?.name || "",
      "Parent Name": `${reg.parentFirstName} ${reg.parentLastName}`,
      "Parent Phone": reg.parentPhone,
      "Parent Email": reg.parentEmail,
      "Registration Date": reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : "",
      "Payment Status": reg.paymentStatus,
      "Payment Reference": reg.paymentReference || "",
      "Split Code Used": reg.splitCodeUsed || "No split code",
    }))

    // Convert to CSV using csv-stringify
    const csv = stringify(csvData, {
      header: true,
      encoding: "utf-8",
    })

    return {
      success: true,
      csv,
    }
  } catch (error) {
    console.error("CSV export error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
// Note: Import function removed for now as it has dependency issues
// and is not currently needed for the coordinator/admin functionality
