import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, chapterCoordinators } from "@/db/schema"
import { eq, and, sql, ilike } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    
    const db = getDbConnection()

    // Query to find potential duplicates by full name within each chapter
    let duplicatesQuery = `
      WITH duplicate_groups AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          chapter_id,
          COUNT(*) as duplicate_count,
          MIN(created_at) as first_registration,
          MAX(created_at) as last_registration
        FROM registrations 
        WHERE 1=1
    `

    const params: any[] = []
    
    // Add chapter filter if specified
    if (chapterId && chapterId !== "all") {
      duplicatesQuery += ` AND chapter_id = $${params.length + 1}`
      params.push(parseInt(chapterId))
    }    duplicatesQuery += `
        GROUP BY TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))), chapter_id
        HAVING COUNT(*) > 1
      )
      SELECT 
        r.id,
        r.registration_number,
        r.first_name,
        r.middle_name,
        r.last_name,
        r.school_name,
        r.payment_status,
        r.created_at,
        r.coordinator_registered_by,
        r.chapter_id,
        c.name as chapter_name,
        dg.duplicate_count,
        dg.first_registration,
        dg.last_registration,
        TRIM(LOWER(CONCAT(r.first_name, ' ', COALESCE(r.middle_name, ''), ' ', r.last_name))) as full_name_normalized
      FROM registrations r
      JOIN duplicate_groups dg ON 
        TRIM(LOWER(CONCAT(r.first_name, ' ', COALESCE(r.middle_name, ''), ' ', r.last_name))) = dg.full_name_normalized 
        AND r.chapter_id = dg.chapter_id
      LEFT JOIN chapters c ON r.chapter_id = c.id
      ORDER BY dg.duplicate_count DESC, r.chapter_id, dg.full_name_normalized, r.created_at
    `

    let duplicates: any
    
    if (params.length > 0) {
      // Interpolate chapterId directly into the query string
      const queryWithChapter = duplicatesQuery.replace("$1", params[0])
      duplicates = await db.execute(sql.raw(queryWithChapter))
    } else {
      // No parameters, just execute the raw query
      duplicates = await db.execute(sql.raw(duplicatesQuery))
    }

    // Group duplicates by normalized name and chapter
    const groupedDuplicates = new Map()
    
    for (const row of duplicates.rows) {
      const key = `${row.chapter_id}-${row.full_name_normalized}`
      if (!groupedDuplicates.has(key)) {
        groupedDuplicates.set(key, {
          chapterId: row.chapter_id,
          chapterName: row.chapter_name,
          fullNameNormalized: row.full_name_normalized,
          duplicateCount: row.duplicate_count,
          firstRegistration: row.first_registration,
          lastRegistration: row.last_registration,
          registrations: []
        })
      }
      
      groupedDuplicates.get(key).registrations.push({
        id: row.id,
        registrationNumber: row.registration_number,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        schoolName: row.school_name,
        paymentStatus: row.payment_status,
        createdAt: row.created_at,
        coordinatorRegisteredBy: row.coordinator_registered_by
      })
    }

    // Convert to array and sort
    const duplicateGroups = Array.from(groupedDuplicates.values())
      .sort((a, b) => b.duplicateCount - a.duplicateCount)

    // Get summary statistics
    const totalDuplicateGroups = duplicateGroups.length
    const totalDuplicateRegistrations = duplicateGroups.reduce((sum, group) => sum + group.registrations.length, 0)
    const chaptersAffected = new Set(duplicateGroups.map(group => group.chapterId)).size

    return NextResponse.json({
      success: true,
      duplicateGroups,
      summary: {
        totalDuplicateGroups,
        totalDuplicateRegistrations,
        chaptersAffected
      }
    })

  } catch (error) {
    console.error("Error fetching duplicate registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch duplicate registrations" },
      { status: 500 }
    )
  }
}
