import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { sql } from "drizzle-orm"
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
  
  // Support both old and new parameter formats
  const chapterParam = searchParams.get("chapter") || searchParams.get("chapterId") || "all"
  const type = searchParams.get("type") || "status"
  const timeRange = searchParams.get("timeRange") || "month"
  
  // New detailed report parameters
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const schoolId = searchParams.get("schoolId")
  const paymentStatus = searchParams.get("paymentStatus")
  const registrationType = searchParams.get("registrationType")
  const search = searchParams.get("search")
  
  // Check if this is a detailed report request
  const isDetailedReport = startDate || endDate || schoolId || paymentStatus || registrationType || search  
  try {
    // Handle detailed report requests
    if (isDetailedReport) {
      return await handleDetailedReport(searchParams)
    }
    
    // Original report logic for backward compatibility
    return await handleLegacyReport(chapterParam, type, timeRange)
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

async function handleDetailedReport(searchParams: URLSearchParams) {  // Build dynamic WHERE conditions for detailed report
  const conditions = []
  
  if (searchParams.get("startDate")) {
    const startDate = new Date(searchParams.get("startDate")!).toISOString()
    conditions.push(`r.created_at >= '${startDate}'`)
  }
  
  if (searchParams.get("endDate")) {
    const endDate = new Date(searchParams.get("endDate")!).toISOString()
    conditions.push(`r.created_at <= '${endDate}'`)
  }
  
  if (searchParams.get("chapterId") && searchParams.get("chapterId") !== "") {
    const chapterId = parseInt(searchParams.get("chapterId")!)
    conditions.push(`r.chapter_id = ${chapterId}`)
  }
  
  if (searchParams.get("schoolId") && searchParams.get("schoolId") !== "") {
    const schoolId = parseInt(searchParams.get("schoolId")!)
    conditions.push(`r.school_id = ${schoolId}`)
  }
  
  if (searchParams.get("centerId") && searchParams.get("centerId") !== "") {
    const centerId = parseInt(searchParams.get("centerId")!)
    conditions.push(`r.center_id = ${centerId}`)
  }
  
  if (searchParams.get("paymentStatus") && searchParams.get("paymentStatus") !== "") {
    const paymentStatus = searchParams.get("paymentStatus")!
    conditions.push(`r.payment_status = '${paymentStatus}'`)
  }
  
  if (searchParams.get("search") && searchParams.get("search") !== "") {
    const searchTerm = searchParams.get("search")!.toLowerCase()
    conditions.push(`(
      LOWER(r.first_name) LIKE '%${searchTerm}%' OR 
      LOWER(r.last_name) LIKE '%${searchTerm}%' OR 
      LOWER(r.parent_email) LIKE '%${searchTerm}%'
    )`)
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    // Fetch detailed registrations data
  const detailQuery = `
    SELECT 
      r.id,
      r.first_name,
      r.last_name,
      r.parent_email,
      r.parent_phone,
      ch.name as chapter_name,
      s.name as school_name,
      c.name as center_name,
      r.payment_status,
      r.created_at as registration_date,
      r.registration_type,
      sp.amount_paid
    FROM registrations r
    LEFT JOIN chapters ch ON r.chapter_id = ch.id
    LEFT JOIN schools s ON r.school_id = s.id
    LEFT JOIN centers c ON r.center_id = c.id
    LEFT JOIN slot_purchases sp ON r.payment_reference = sp.payment_reference
    ${whereClause}
    ORDER BY r.created_at DESC
  `
    const db = getDbConnection()  // Execute detailed query with embedded parameters
  // Use sql template literal for parameterized queries
  const detailedResult = await db.execute(sql.raw(detailQuery))
  const registrationsData = detailedResult.rows
    console.log('Raw registrations data:', registrationsData.slice(0, 3)) // Log first 3 rows
    // Calculate summary statistics with proper validation
  const totalRegistrations = registrationsData.length
  const paidRegistrations = registrationsData.filter((reg: any) => 
    reg.payment_status === 'completed'
  ).length
  const pendingRegistrations = registrationsData.filter((reg: any) => 
    reg.payment_status === 'pending'
  ).length
  
  console.log('Calculated metrics:', { totalRegistrations, paidRegistrations, pendingRegistrations })
  
  // Group by chapter
  const byChapter = registrationsData.reduce((acc: Record<string, number>, reg: any) => {
    const chapter = reg.chapter_name || 'Unknown'
    acc[chapter] = (acc[chapter] || 0) + 1
    return acc
  }, {})
  
  // Group by school
  const bySchool = registrationsData.reduce((acc: Record<string, number>, reg: any) => {
    const school = reg.school_name || 'Unknown'
    acc[school] = (acc[school] || 0) + 1
    return acc
  }, {})
  // Group by payment status with proper categorization
  const byPaymentStatus = registrationsData.reduce((acc: Record<string, number>, reg: any) => {
    const status = reg.payment_status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
  
  const summary = {
    totalRegistrations: Number(totalRegistrations) || 0,
    paidRegistrations: Number(paidRegistrations) || 0,
    pendingRegistrations: Number(pendingRegistrations) || 0,
    byChapter,
    bySchool,
    byPaymentStatus
  }
  
  console.log('Final summary:', summary)
  
  return NextResponse.json({
    registrations: registrationsData,
    summary
  })
}

async function handleLegacyReport(chapterParam: string, type: string, timeRange: string) {
  const db = getDbConnection()
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
      dateFilter = `AND r.created_at >= '${format(startDate, 'yyyy-MM-dd')}'`
    }
    
    // Filter by chapter if specified
    const chapterFilter = chapterParam !== "all" 
      ? `AND r.chapter_id = ${parseInt(chapterParam)}`
      : ""
    
    // Get report data grouped by chapter
    const reportQuery = `
      SELECT 
        ch.name as chapter_name,
        COUNT(CASE WHEN r.payment_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN r.payment_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN r.registration_type = 'coordinator' THEN 1 END) as coordinator_registrations,
        COUNT(CASE WHEN r.registration_type = 'public' THEN 1 END) as public_registrations,
        COUNT(*) as total_registrations
      FROM registrations r
      LEFT JOIN chapters ch ON r.chapter_id = ch.id
      WHERE 1=1
      ${chapterFilter}
      ${dateFilter}
      GROUP BY ch.name
      ORDER BY ch.name
    `
    
    // ...existing code... (using db initialized above)
    const reportResult = await db.execute(sql.raw(reportQuery))
    const reportRows = reportResult.rows
    
    // If trend report is requested, get additional trend data
    // Prepare trend data
    let trendData: { date: string; registrations: number }[] = []
    if (type === "trend") {      const trendQuery = `
        SELECT 
          TO_CHAR(r.created_at::date, 'YYYY-MM-DD') as date,
          COUNT(*) as registrations
        FROM registrations r
        WHERE 1=1
        ${chapterFilter}
        ${dateFilter}
        GROUP BY date
        ORDER BY date ASC
      `
      
      // Execute trend query
      const trendResult = await db.execute(sql.raw(trendQuery))
      // Cast to correct type
      trendData = trendResult.rows as { date: string; registrations: number }[]
    }    // Calculate summary fields for compatibility with frontend
    let totalRegistrations = 0;
    let paidRegistrations = 0;
    let pendingRegistrations = 0;
    const byChapter: Record<string, number> = {};
    const bySchool: Record<string, number> = {};
    const byPaymentStatus: Record<string, number> = { completed: 0, pending: 0 };

    for (const row of reportRows) {
      const chapter = row.chapter_name || 'Unknown';
      const chapterKey = String(chapter);
      const total = Number(row.total_registrations) || 0;
      const completed = Number(row.completed) || 0;
      const pending = Number(row.pending) || 0;
      byChapter[chapterKey] = (byChapter[chapterKey] || 0) + total;
      totalRegistrations += total;
      paidRegistrations += completed;
      pendingRegistrations += pending;
      byPaymentStatus.completed += completed;
      byPaymentStatus.pending += pending;
    }

    // Compose summary object
    const summary = {
      totalRegistrations: Number(totalRegistrations) || 0,
      paidRegistrations: Number(paidRegistrations) || 0,
      pendingRegistrations: Number(pendingRegistrations) || 0,
      byChapter,
      bySchool, // Not available in legacy, but keep for compatibility
      byPaymentStatus
    };

    return NextResponse.json({ reportData: reportRows, trendData, summary });
}