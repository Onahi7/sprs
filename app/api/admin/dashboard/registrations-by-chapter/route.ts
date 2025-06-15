import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters } from "@/db/schema"
import { sql, eq } from "drizzle-orm"

export async function GET() {
  console.log("Registrations by chapter API: Request received")
  try {
    console.log("Registrations by chapter API: Getting session")
    const session = await getSession()
    console.log("Registrations by chapter API: Session result:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Registrations by chapter API: Unauthorized - no valid admin session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("Registrations by chapter API: Getting database connection")
    const db = getDbConnection()
    
    // Get registrations by chapter with detailed statistics
    const registrationsByChapter = await db.execute(sql`
      SELECT 
        c.id as chapter_id,
        c.name as chapter_name,
        COUNT(r.id)::int as total_registrations,
        COUNT(CASE WHEN r.payment_status = 'completed' THEN 1 END)::int as paid_registrations,
        COUNT(CASE WHEN r.payment_status = 'pending' THEN 1 END)::int as pending_registrations,
        COALESCE(SUM(CASE WHEN r.payment_status = 'completed' THEN c.amount::numeric ELSE 0 END), 0) as total_revenue,        CASE 
          WHEN COUNT(r.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN r.payment_status = 'completed' THEN 1 END)::numeric / COUNT(r.id)::numeric) * 100, 2)
          ELSE 0 
        END as registration_rate
      FROM ${chapters} c
      LEFT JOIN ${registrations} r ON c.id = r.chapter_id
      GROUP BY c.id, c.name, c.amount
      ORDER BY total_registrations DESC, c.name ASC
    `)

    const result = registrationsByChapter.rows.map(row => ({
      chapterId: row.chapter_id,
      chapterName: row.chapter_name,
      totalRegistrations: Number(row.total_registrations),
      paidRegistrations: Number(row.paid_registrations),
      pendingRegistrations: Number(row.pending_registrations),
      totalRevenue: Number(row.total_revenue),
      registrationRate: Number(row.registration_rate)
    }))

    console.log("Registrations by chapter API: Returning data for", result.length, "chapters")
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching registrations by chapter:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations by chapter" }, 
      { status: 500 }
    )
  }
}
