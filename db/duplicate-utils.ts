import { getDbConnection } from "@/db/utils"
import { registrations } from "@/db/schema"
import { sql } from "drizzle-orm"

/**
 * Get a count of duplicate registrations across all chapters
 */
export async function getDuplicateRegistrationsCount(): Promise<number> {
  try {
    const db = getDbConnection()
    
    // This query finds duplicate names within the same chapter
    const query = `
      WITH duplicate_groups AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          chapter_id,
          COUNT(*) as duplicate_count
        FROM registrations 
        GROUP BY TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))), chapter_id
        HAVING COUNT(*) > 1
      )
      SELECT COUNT(*) as count FROM duplicate_groups
    `
    
    const result = await db.execute(sql.raw(String(query)))
    
    if (result.rows && result.rows.length > 0) {
      return parseInt(result.rows[0].count) || 0
    }
    
    return 0
  } catch (error) {
    console.error('Error counting duplicate registrations:', error)
    return 0
  }
}
