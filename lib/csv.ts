// CSV Import/Export
import { parse, stringify } from "csv-stringify/sync"
import { getDbConnection } from "@/db/utils"
import { chapters, schools, centers, registrations } from "@/db/schema"
import { eq, and, gte, lte, desc, asc } from "drizzle-orm"

export async function exportRegistrationsToCSV(filters: {
  chapterId?: number
  status?: "pending" | "completed"
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
    
    if (filters.startDate) {
      whereConditions.push(gte(registrations.createdAt, filters.startDate))
    }
    
    if (filters.endDate) {
      whereConditions.push(lte(registrations.createdAt, filters.endDate))
    }
    
    // Build the query with all conditions
    const query = whereConditions.length > 0 
      ? { where: and(...whereConditions) } 
      : {};
      
    // Execute the query
    const results = await db.query.registrations.findMany({
      ...query,
      with: {
        chapter: true,
        school: true,
        center: true,
      },
      orderBy: [asc(registrations.registrationNumber)],
    })

    // Prepare data for CSV
    const csvData = filteredResults.map((reg) => ({
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
      "Registration Date": new Date(reg.createdAt).toLocaleDateString(),
      "Payment Status": reg.paymentStatus,
      "Payment Reference": reg.paymentReference || "",
    }))

    // Convert to CSV
    const csv = unparse(csvData, {
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

export async function importCSV(file: File, entityType: "chapter" | "school" | "center") {
  return new Promise<{
    success: boolean
    inserted?: number
    errors?: string[]
    error?: string
  }>((resolve, reject) => {
    try {
      // Parse CSV file
      parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const { data, errors: parseErrors } = results
          const errors: string[] = parseErrors.map((e) => e.message)
          let inserted = 0

          try {
            // Process based on entity type
            switch (entityType) {
              case "chapter":
                for (const row of data) {
                  if (!row.name) {
                    errors.push(`Row missing required field 'name': ${JSON.stringify(row)}`)
                    continue
                  }

                  try {
                    await db.insert(chapters).values({
                      name: row.name,
                      splitCode: row.split_code || null,
                      amount: row.amount ? Number.parseFloat(row.amount) : 3000.0,
                    })
                    inserted++
                  } catch (error) {
                    errors.push(`Error inserting chapter: ${row.name} - ${error}`)
                  }
                }
                break

              case "school":
                for (const row of data) {
                  if (!row.name || !row.chapter_id) {
                    errors.push(`Row missing required fields 'name' or 'chapter_id': ${JSON.stringify(row)}`)
                    continue
                  }

                  try {
                    await db.insert(schools).values({
                      name: row.name,
                      chapterId: Number.parseInt(row.chapter_id),
                    })
                    inserted++
                  } catch (error) {
                    errors.push(`Error inserting school: ${row.name} - ${error}`)
                  }
                }
                break

              case "center":
                for (const row of data) {
                  if (!row.name || !row.chapter_id) {
                    errors.push(`Row missing required fields 'name' or 'chapter_id': ${JSON.stringify(row)}`)
                    continue
                  }

                  try {
                    await db.insert(centers).values({
                      name: row.name,
                      chapterId: Number.parseInt(row.chapter_id),
                    })
                    inserted++
                  } catch (error) {
                    errors.push(`Error inserting center: ${row.name} - ${error}`)
                  }
                }
                break

              default:
                resolve({
                  success: false,
                  error: "Invalid entity type",
                })
                return
            }

            resolve({
              success: true,
              inserted,
              errors: errors.length > 0 ? errors : undefined,
            })
          } catch (error) {
            resolve({
              success: false,
              error: error instanceof Error ? error.message : "An unknown error occurred",
              errors: errors.length > 0 ? errors : undefined,
            })
          }
        },
        error: (error) => {
          resolve({
            success: false,
            error: error.message,
          })
        },
      })
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    }
  })
}
