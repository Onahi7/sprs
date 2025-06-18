import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get chapter ID from the session or query param
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId") || session.chapterId
    
    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }
    
    const db = getDbConnection()
    
    // Query to find duplicate names within the coordinator's chapter
    const query = `
      WITH duplicate_groups AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          COUNT(*) as duplicate_count
        FROM registrations 
        WHERE chapter_id = $1
        GROUP BY TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name)))
        HAVING COUNT(*) > 1
      )
      SELECT COUNT(*) as count FROM duplicate_groups
    `
    
    const safeChapterId = Number(chapterId)
    const queryWithChapter = query.replace("$1", String(safeChapterId))
    const result = await db.execute(sql.raw(queryWithChapter))

    const duplicateCount = result.rows && result.rows.length > 0 
      ? parseInt(result.rows[0].count) || 0
      : 0

    return NextResponse.json({
      success: true,
      duplicateCount
    })
    
  } catch (error) {
    console.error("Error checking for duplicates:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    )
  }
}
