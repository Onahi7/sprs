import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { format, subDays, startOfYear } from "date-fns"
import { stringify } from "csv-stringify"
import { sql } from "drizzle-orm"
import { registrations, centers, schools, chapters } from "@/db/schema"

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
      return new NextResponse("No centers found", { status: 404 })
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
    
    // Filter by center if specified
    const centerFilter = centerParam !== "all" 
      ? `AND r."centerId" = ${parseInt(centerParam)}`
      : `AND r."centerId" = ANY('{${centerIds.join(',')}}')`
    
    let csvHeaders: string[] = []
    let csvData: any[] = []
    
    if (type === "status" || type === "payment") {
      const query = `
        SELECT 
          c.name as "Center",
          s.name as "School",
          r."candidateName" as "Candidate Name",
          r."parentName" as "Parent Name",
          r."phoneNumber" as "Phone Number",
          r."emailAddress" as "Email",
          r.status as "Status",
          r."paymentStatus" as "Payment Status",
          TO_CHAR(r."createdAt", 'YYYY-MM-DD') as "Registration Date"
        FROM registrations r
        JOIN centers c ON r."centerId" = c.id
        JOIN schools s ON r."schoolId" = s.id
        WHERE 1=1
        ${centerFilter}
        ${dateFilter}
        ORDER BY r."createdAt" DESC
      `
      
      const { rows: resultRows } = await db.query(query)
      
      if (resultRows.length > 0) {
        csvHeaders = Object.keys(resultRows[0])
        csvData = resultRows
      }
    } else if (type === "trend") {
      const query = `
        SELECT 
          TO_CHAR(r."createdAt"::date, 'YYYY-MM-DD') as "Date",
          COUNT(*) as "Registrations"
        FROM registrations r
        WHERE 1=1
        ${centerFilter}
        ${dateFilter}
        GROUP BY "Date"
        ORDER BY "Date" ASC
      `
      
      const { rows: resultRows } = await db.query(query)
      
      if (resultRows.length > 0) {
        csvHeaders = Object.keys(resultRows[0])
        csvData = resultRows
      }
    }
    
    // If no data was found
    if (csvData.length === 0) {
      return new NextResponse("No data found for the selected filters", { status: 404 })
    }
    
    // Generate CSV content
    const csvContent = await new Promise<string>((resolve, reject) => {
      stringify(csvData, {
        header: true,
        columns: csvHeaders
      }, (err, output) => {
        if (err) reject(err)
        else resolve(output)
      })
    })
    
    // Return CSV as file download
    const fileName = `${type}-report-${timeRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to generate report export"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
