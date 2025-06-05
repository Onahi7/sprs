import { NextResponse } from "next/server"
import { db } from "@/db"
import { getSession } from "@/lib/auth"
import { format, subDays, startOfYear } from "date-fns"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }
  
  const { searchParams } = new URL(request.url)
  const chapterParam = searchParams.get("chapter") || "all"
  const type = searchParams.get("type") || "status"
  const timeRange = searchParams.get("timeRange") || "month"
  
  try {
    // Determine date range for filtering
    let dateFilter = ""
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case "week":
        startDate = subDays(now, 7)
        break
      case "month":
        startDate = subDays(now, 30)
        break
      case "quarter":
        startDate = subDays(now, 90)
        break
      case "year":
        startDate = startOfYear(now)
        break
      default: // "all" or invalid values
        startDate = new Date(0) // Beginning of time
    }
    
    if (timeRange !== "all") {
      dateFilter = `AND r."createdAt" >= '${format(startDate, 'yyyy-MM-dd')}'`
    }
    
    // Filter by chapter if specified
    const chapterFilter = chapterParam !== "all" 
      ? `AND c."chapterId" = ${parseInt(chapterParam)}`
      : ""
    
    // Get report data grouped by chapter
    const reportQuery = `
      SELECT 
        ch.name as chapterName,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN r."paymentStatus" = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN r."paymentStatus" = 'unpaid' THEN 1 ELSE 0 END) as unpaid
      FROM registrations r
      JOIN centers c ON r."centerId" = c.id
      JOIN chapters ch ON c."chapterId" = ch.id
      WHERE 1=1
      ${chapterFilter}
      ${dateFilter}
      GROUP BY ch.name
      ORDER BY ch.name
    `
    
    const { rows: reportRows } = await db.query(reportQuery)
    
    // If trend report is requested, get additional trend data
    let trendData = []
    if (type === "trend") {
      const trendQuery = `
        SELECT 
          TO_CHAR(r."createdAt"::date, 'YYYY-MM-DD') as date,
          COUNT(*) as registrations
        FROM registrations r
        JOIN centers c ON r."centerId" = c.id
        WHERE 1=1
        ${chapterFilter}
        ${dateFilter}
        GROUP BY date
        ORDER BY date ASC
      `
      
      const { rows: trendRows } = await db.query(trendQuery)
      trendData = trendRows
    }
    
    return NextResponse.json({ reportData: reportRows, trendData })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch report data"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
