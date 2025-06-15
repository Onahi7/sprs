import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { format, subDays, startOfYear } from "date-fns"
import { stringify } from "csv-stringify"
import { sql } from "drizzle-orm"
import { registrations, centers, schools, chapters } from "@/db/schema"
import PDFDocument from "pdfkit"

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
  const exportFormat = searchParams.get("format") || "csv" // New parameter for format
  
  // Support new detailed report parameters
  const startDateParam = searchParams.get("startDate")
  const endDateParam = searchParams.get("endDate")
  const schoolId = searchParams.get("schoolId")
  const paymentStatus = searchParams.get("paymentStatus")
  const search = searchParams.get("search")
  
  // Check if this is a detailed report request
  const isDetailedReport = startDateParam || endDateParam || schoolId || paymentStatus || search
  
  try {
    // Handle detailed reports
    if (isDetailedReport) {
      return await handleDetailedReportExport(searchParams, exportFormat, session)
    }
    
    // Handle legacy reports
    return await handleLegacyReportExport(chapterParam, type, timeRange, exportFormat)
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

async function handleDetailedReportExport(searchParams: URLSearchParams, exportFormat: string, session: any) {
  const db = getDbConnection()
    // Build dynamic WHERE conditions
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
    const query = `
    SELECT 
      r.id as "ID",
      r.first_name as "First Name",
      r.last_name as "Last Name",
      r.parent_email as "Email",
      r.parent_phone as "Phone",
      ch.name as "Chapter",
      s.name as "School",
      c.name as "Center",
      r.payment_status as "Payment Status",
      r.registration_type as "Registration Type",
      TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI:SS') as "Registration Date"
    FROM registrations r
    LEFT JOIN chapters ch ON r.chapter_id = ch.id
    LEFT JOIN schools s ON r.school_id = s.id
    LEFT JOIN centers c ON r.center_id = c.id
    ${whereClause}
    ORDER BY r.created_at DESC
  `
  
  const result = await db.execute(sql.raw(query))
  const data = result.rows
  
  if (exportFormat === 'pdf') {
    return await generatePDFReport(data, searchParams, session)
  } else {
    return await generateCSVReport(data, 'detailed-registration-report')
  }
}

async function handleLegacyReportExport(chapterParam: string, type: string, timeRange: string, exportFormat: string) {
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
    
    let data: any[] = []
    let fileName = ""
    
    if (type === "status" || type === "payment") {      const query = `
        SELECT 
          ch.name as "Chapter",
          c.name as "Center",
          s.name as "School",
          r.first_name as "First Name",
          r.last_name as "Last Name",
          r.parent_phone as "Phone Number",
          r.parent_email as "Email",
          r.payment_status as "Payment Status",
          r.registration_type as "Registration Type",
          TO_CHAR(r.created_at, 'YYYY-MM-DD') as "Registration Date"
        FROM registrations r
        LEFT JOIN chapters ch ON r.chapter_id = ch.id
        LEFT JOIN schools s ON r.school_id = s.id
        LEFT JOIN centers c ON r.center_id = c.id
        WHERE 1=1
        ${chapterFilter}
        ${dateFilter}
        ORDER BY ch.name, c.name, r.created_at DESC
      `
      const db = getDbConnection()
      const result = await db.execute(sql.raw(query))
      data = result.rows
      fileName = `${type}-report-${timeRange}`
    } else if (type === "trend") {      const query = `
        SELECT 
          TO_CHAR(r.created_at::date, 'YYYY-MM-DD') as "Date",
          COUNT(*) as "Registrations"
        FROM registrations r
        WHERE 1=1
        ${chapterFilter}
        ${dateFilter}
        GROUP BY "Date"
        ORDER BY "Date" ASC
      `
        const db = getDbConnection()
      const result = await db.execute(sql.raw(query))
      data = result.rows
      fileName = `${type}-report-${timeRange}`
    } else if (type === "geographic") {
      const query = `
        SELECT 
          ch.name as "Chapter",
          c.name as "Center",
          COUNT(*) as "Total Registrations",
          COUNT(CASE WHEN r.payment_status = 'completed' THEN 1 END) as "Completed Payments",
          COUNT(CASE WHEN r.payment_status = 'pending' THEN 1 END) as "Pending Payments"
        FROM registrations r
        LEFT JOIN chapters ch ON r.chapter_id = ch.id
        LEFT JOIN centers c ON r.center_id = c.id
        WHERE 1=1
        ${chapterFilter}
        ${dateFilter}
        GROUP BY ch.name, c.name
        ORDER BY ch.name, c.name
      `
      
      const db = getDbConnection()
      const result = await db.execute(sql.raw(query))
      data = result.rows
      fileName = `${type}-report-${timeRange}`
    }
    
    // If no data was found
    if (data.length === 0) {
      return new NextResponse("No data found for the selected filters", { status: 404 })
    }
    
    if (exportFormat === 'pdf') {
      // For legacy reports, we'll generate a simple PDF
      return await generateSimplePDFReport(data, fileName, type)
    } else {
      return await generateCSVReport(data, fileName)
    }
}

async function generateCSVReport(data: any[], fileName: string) {
  if (data.length === 0) {
    return new NextResponse("No data found for the selected filters", { status: 404 })
  }
  
  const csvHeaders = Object.keys(data[0])
  
  const csvContent = await new Promise<string>((resolve, reject) => {
    stringify(data, {
      header: true,
      columns: csvHeaders
    }, (err, output) => {
      if (err) reject(err)
      else resolve(output)
    })
  })
  
  const fullFileName = `${fileName}-${format(new Date(), 'yyyy-MM-dd')}.csv`
  
  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fullFileName}"`
    }
  })
}

async function generatePDFReport(data: any[], searchParams: URLSearchParams, session: any) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 })
    const chunks: any[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      
      resolve(new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="detailed-registration-report-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      }))
    })
    
    // Header
    doc.fontSize(20).font('Helvetica-Bold')
    doc.text('STUDENT REGISTRATION REPORT', { align: 'center' })
    doc.moveDown()
    
    // Report metadata
    doc.fontSize(10).font('Helvetica')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' })
    doc.text(`Generated by: ${session.firstName} ${session.lastName}`, { align: 'right' })
    doc.moveDown()
    
    // Summary section
    doc.fontSize(14).font('Helvetica-Bold')
    doc.text('SUMMARY STATISTICS')
    doc.moveDown(0.5)
    
    doc.fontSize(10).font('Helvetica')
    const totalRegistrations = data.length
    const totalAmount = data.reduce((sum: number, reg: any) => sum + (parseInt(reg.Amount) || 0), 0)
    const paidRegistrations = data.filter((reg: any) => reg['Payment Status'] === 'paid').length
    const pendingRegistrations = data.filter((reg: any) => reg['Payment Status'] === 'pending').length
    
    const summaryData = [
      ['Total Registrations:', totalRegistrations.toString()],
      ['Total Revenue:', `₦${totalAmount.toLocaleString()}`],
      ['Paid Registrations:', paidRegistrations.toString()],
      ['Pending Payments:', pendingRegistrations.toString()],
      ['Success Rate:', `${totalRegistrations > 0 ? ((paidRegistrations / totalRegistrations) * 100).toFixed(1) : 0}%`]
    ]
    
    summaryData.forEach(([label, value]) => {
      doc.text(`${label} ${value}`, { width: 200, continued: false })
    })
    
    doc.moveDown()
    
    // Filter information
    doc.fontSize(12).font('Helvetica-Bold')
    doc.text('APPLIED FILTERS')
    doc.moveDown(0.5)
    
    doc.fontSize(9).font('Helvetica')
    if (searchParams.get("startDate")) {
      doc.text(`Start Date: ${new Date(searchParams.get("startDate")!).toLocaleDateString()}`)
    }
    if (searchParams.get("endDate")) {
      doc.text(`End Date: ${new Date(searchParams.get("endDate")!).toLocaleDateString()}`)
    }
    if (searchParams.get("chapterId")) {
      doc.text(`Chapter ID: ${searchParams.get("chapterId")}`)
    }
    if (searchParams.get("paymentStatus")) {
      doc.text(`Payment Status: ${searchParams.get("paymentStatus")}`)
    }
    if (searchParams.get("search")) {
      doc.text(`Search Term: ${searchParams.get("search")}`)
    }
    doc.moveDown()
    
    // Table of detailed data
    doc.addPage()
    doc.fontSize(12).font('Helvetica-Bold')
    doc.text('DETAILED REGISTRATION DATA')
    doc.moveDown()
    
    let currentY = doc.y;
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      const tableTop = doc.y
      const itemHeight = 15
      const pageHeight = doc.page.height - doc.page.margins.bottom - doc.page.margins.top
      // Calculate column widths based on content
      const availableWidth = doc.page.width - 2 * doc.page.margins.left
      const columnWidth = Math.floor(availableWidth / Math.min(headers.length, 6)) // Max 6 columns per page
      currentY = tableTop
      let currentX = 40
      // Draw headers
      doc.fontSize(8).font('Helvetica-Bold')
      headers.slice(0, 6).forEach((header, i) => {
        doc.text(header, currentX, currentY, { width: columnWidth, align: 'left' })
        currentX += columnWidth
      })
      currentY += itemHeight
      doc.moveTo(40, currentY).lineTo(40 + (columnWidth * Math.min(headers.length, 6)), currentY).stroke()
      currentY += 5
      // Draw rows
      doc.font('Helvetica').fontSize(7)
      data.forEach((row: any, index: number) => {
        if (currentY + itemHeight > pageHeight - 40) {
          doc.addPage()
          currentY = 40
          // Redraw headers
          currentX = 40
          doc.font('Helvetica-Bold').fontSize(8)
          headers.slice(0, 6).forEach((header, i) => {
            doc.text(header, currentX, currentY, { width: columnWidth, align: 'left' })
            currentX += columnWidth
          })
          currentY += itemHeight
          doc.moveTo(40, currentY).lineTo(40 + (columnWidth * Math.min(headers.length, 6)), currentY).stroke()
          currentY += 5
          doc.font('Helvetica').fontSize(7)
        }
        currentX = 40
        headers.slice(0, 6).forEach((header, i) => {
          const cellValue = String(row[header] || '').substring(0, 25) // Truncate long values
          doc.text(cellValue, currentX, currentY, { 
            width: columnWidth, 
            align: 'left',
            ellipsis: true
          })
          currentX += columnWidth
        })
        currentY += itemHeight
      })
    }
    // Footer
    doc.fontSize(8).font('Helvetica')
    doc.text(`Total records: ${data.length}`, 40, currentY + 20)
    
    doc.end()
  })
}

async function generateSimplePDFReport(data: any[], fileName: string, type: string) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 })
    const chunks: any[] = []
    
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      
      resolve(new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      }))
    })
    
    // Simple PDF for legacy reports
    doc.fontSize(18).font('Helvetica-Bold')
    doc.text(`${type.toUpperCase()} REPORT`, { align: 'center' })
    doc.moveDown()
    
    doc.fontSize(10).font('Helvetica')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' })
    doc.moveDown()
    
    // Simple table
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      let y = doc.y
      
      doc.fontSize(8).font('Helvetica-Bold')
      headers.forEach((header, i) => {
        doc.text(header, 40 + (i * 80), y, { width: 75 })
      })
      
      y += 20
      doc.font('Helvetica').fontSize(7)
      
      data.forEach((row, rowIndex) => {
        if (y > doc.page.height - 100) {
          doc.addPage()
          y = 40
        }
        
        headers.forEach((header, i) => {
          doc.text(String(row[header] || '').substring(0, 15), 40 + (i * 80), y, { width: 75 })
        })
        y += 15
      })
    }
    
    doc.end()
  })
}
