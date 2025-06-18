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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId") || session.chapterId
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const centerId = searchParams.get("centerId") || null
    const schoolId = searchParams.get("schoolId") || null
    const paymentStatus = searchParams.get("paymentStatus") || null
    const sortBy = searchParams.get("sortBy") || "newest"
    
    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }
    
    const db = getDbConnection()
    
    // Build the base query for duplicate registrations
    let query = `
      WITH duplicates AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          chapter_id
        FROM registrations 
        WHERE chapter_id = ${Number(chapterId)}
        GROUP BY full_name_normalized, chapter_id
        HAVING COUNT(*) > 1
      )
      SELECT 
        r.id,
        r.registration_number as "registrationNumber",
        r.first_name as "firstName",
        r.middle_name as "middleName",
        r.last_name as "lastName",
        r.school_id as "schoolId",
        r.school_name as "schoolName",
        r.center_id as "centerId",
        r.payment_status as "paymentStatus",
        r.created_at as "createdAt",
        r.coordinator_registered_by as "coordinatorRegisteredBy",
        r.registration_type as "registrationType"
      FROM 
        registrations r
      JOIN 
        duplicates d 
      ON 
        TRIM(LOWER(CONCAT(r.first_name, ' ', COALESCE(r.middle_name, ''), ' ', r.last_name))) = d.full_name_normalized
        AND r.chapter_id = d.chapter_id
      WHERE 
        r.chapter_id = ${Number(chapterId)}
    `
    
    // Add additional filters
    const whereConditions = []
    
    if (search) {
      whereConditions.push(`
        (r.first_name ILIKE '%${search.replace(/'/g, "''")}%' 
        OR r.last_name ILIKE '%${search.replace(/'/g, "''")}%'
        OR r.registration_number ILIKE '%${search.replace(/'/g, "''")}%')
      `)
    }
    
    if (centerId) {
      whereConditions.push(`r.center_id = ${Number(centerId)}`)
    }
    
    if (schoolId) {
      whereConditions.push(`r.school_id = ${Number(schoolId)}`)
    }
    
    if (paymentStatus) {
      whereConditions.push(`r.payment_status = '${paymentStatus.replace(/'/g, "''")}'`)
    }
    
    if (whereConditions.length > 0) {
      query += ` AND ${whereConditions.join(' AND ')}`
    }
    
    // Add sorting
    if (sortBy === "oldest") {
      query += ` ORDER BY r.created_at ASC`
    } else {
      query += ` ORDER BY r.created_at DESC`
    }
    
    // Add pagination
    const offset = (page - 1) * limit
    query += ` LIMIT ${limit} OFFSET ${offset}`
    
    // Count total query (for pagination)
    let countQuery = `
      WITH duplicates AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          chapter_id
        FROM registrations 
        WHERE chapter_id = ${Number(chapterId)}
        GROUP BY full_name_normalized, chapter_id
        HAVING COUNT(*) > 1
      )
      SELECT COUNT(*) as total
      FROM 
        registrations r
      JOIN 
        duplicates d 
      ON 
        TRIM(LOWER(CONCAT(r.first_name, ' ', COALESCE(r.middle_name, ''), ' ', r.last_name))) = d.full_name_normalized
        AND r.chapter_id = d.chapter_id
      WHERE 
        r.chapter_id = ${Number(chapterId)}
    `
    
    if (whereConditions.length > 0) {
      countQuery += ` AND ${whereConditions.join(' AND ')}`
    }
    
    // Execute queries
    const result = await db.execute(sql.raw(query))
    const countResult = await db.execute(sql.raw(countQuery))
    
    const total = countResult.rows && countResult.rows.length > 0 
      ? parseInt(countResult.rows[0].total) || 0
      : 0
    
    return NextResponse.json({
      success: true,
      registrations: result.rows || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    console.error("Error fetching duplicate registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch duplicate registrations" },
      { status: 500 }
    )
  }
}
