import { NextResponse } from "next/server"
import { db } from "@/db"
import { registrations } from "@/db/schema"
import { sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }

    const chapterIdNum = Number.parseInt(chapterId)

    // Get data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Format date as YYYY-MM-DD for SQL
    const formattedDate = thirtyDaysAgo.toISOString().split("T")[0]

    // Query to get daily registration counts for the last 30 days
    const dailyRegistrations = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as registrations,
        SUM(CASE WHEN payment_status = 'completed' THEN 1 ELSE 0 END) as payments
      FROM ${registrations}
      WHERE chapter_id = ${chapterIdNum}
        AND created_at >= ${formattedDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)

    // Transform the result to the expected format
    const result = dailyRegistrations.rows.map((row: any) => ({
      date: row.date,
      registrations: Number(row.registrations),
      payments: Number(row.payments),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
