import { NextResponse } from "next/server"
import { db } from "@/db"
import { getSession } from "@/lib/auth"
import { format, subDays, startOfYear } from "date-fns"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }
  
  const coordinatorId = session.userId
  const { searchParams } = new URL(request.url)
  const centerParam = searchParams.get("center") || "all"
  const type = searchParams.get("type") || "status"
  const timeRange = searchParams.get("timeRange") || "week"
  
  try {
    // First, get the centers assigned to this coordinator
    const centersQuery = `
      SELECT c.id, c.name
      FROM centers c
      JOIN coordinators co ON c.id = ANY(co.centerIds)
      WHERE co.id = $1
    `
    
    const { rows: centers } = await db.query(centersQuery, [coordinatorId])
    const centerIds = centers.map(center => center.id)
    
    if (centerIds.length === 0) {
      return NextResponse.json({ reportData: [] })
    }
    
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
    
    // Generate report data based on type
    let reportData = []
    let trendData = []
    
    // Filter by center if specified
    const centerFilter = centerParam !== "all" 
      ? `AND r."centerId" = ${parseInt(centerParam)}`
      : `AND r."centerId" = ANY('{${centerIds.join(',')}}')`
    
    // Get report data grouped by center
    const reportQuery = `
      SELECT 
        c.name as centerName,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN r."paymentStatus" = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN r."paymentStatus" = 'unpaid' THEN 1 ELSE 0 END) as unpaid
      FROM registrations r
      JOIN centers c ON r."centerId" = c.id
      WHERE 1=1
      ${centerFilter}
      ${dateFilter}
      GROUP BY c.name
      ORDER BY c.name
    `
    
    const { rows: reportRows } = await db.query(reportQuery)
    reportData = reportRows
    
    // If trend report is requested, get additional trend data
    if (type === "trend") {
      const trendQuery = `
        SELECT 
          TO_CHAR(r."createdAt"::date, 'YYYY-MM-DD') as date,
          COUNT(*) as registrations
        FROM registrations r
        WHERE 1=1
        ${centerFilter}
        ${dateFilter}
        GROUP BY date
        ORDER BY date ASC
      `
      
      const { rows: trendRows } = await db.query(trendQuery)
      trendData = trendRows
    }
    
    return NextResponse.json({ reportData, trendData })
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
