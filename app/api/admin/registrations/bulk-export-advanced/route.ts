import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations, chapters, schools, centers, chapterCoordinators } from "@/db/schema"
import { eq, gte, lte, and } from "drizzle-orm"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const chapterId = searchParams.get("chapterId")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const db = getDbConnection()

    // Build where conditions
    const whereConditions = []

    if (chapterId && chapterId !== "all") {
      whereConditions.push(eq(registrations.chapterId, Number.parseInt(chapterId)))
    }

    if (dateFrom) {
      whereConditions.push(gte(registrations.createdAt, new Date(dateFrom)))
    }

    if (dateTo) {
      whereConditions.push(lte(registrations.createdAt, new Date(dateTo)))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    // Get registrations with all related data
    const allRegistrations = await db.query.registrations.findMany({
      where: whereClause,
      with: {
        chapter: true,
        school: true,
        center: true,
        coordinatorRegisteredBy: true,
      },
      orderBy: [registrations.createdAt]
    })

    // Transform data for export
    const exportData = allRegistrations.map(reg => ({
      'Registration Number': reg.registrationNumber,
      'First Name': reg.firstName,
      'Middle Name': reg.middleName || '',
      'Last Name': reg.lastName,
      'Chapter': reg.chapter?.name || 'Unknown',
      'School': reg.school?.name || reg.schoolName || 'Unknown',
      'Center': reg.center?.name || 'Not Assigned',
      'Parent First Name': reg.parentFirstName,
      'Parent Last Name': reg.parentLastName,
      'Parent Phone': reg.parentPhone,
      'Parent Email': reg.parentEmail,
      'Parent Consent': reg.parentConsent ? 'Yes' : 'No',
      'Payment Status': reg.paymentStatus,
      'Payment Reference': reg.paymentReference || 'N/A',
      'Split Code Used': reg.splitCodeUsed || 'N/A',
      'Registration Type': reg.registrationType || 'public',
      'Registered By Coordinator': reg.coordinatorRegisteredBy?.name || 'N/A',
      'Registration Date': reg.createdAt?.toISOString().split('T')[0] || '',
      'Slip Downloaded': reg.registrationSlipDownloaded ? 'Yes' : 'No',
      'Download Count': reg.registrationSlipDownloadCount || 0
    }))

    // Generate different formats
    switch (format) {
      case 'xlsx':
        return generateExcelExport(exportData)
      case 'pdf':
        return generatePDFReport(exportData, { chapterId, dateFrom, dateTo })
      default:
        return generateCSVExport(exportData)
    }

  } catch (error) {
    console.error("Error in advanced export:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}

function generateCSVExport(data: any[]) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 })
  }

  const csvHeaders = Object.keys(data[0])
  const csvContent = [
    csvHeaders.join(","),
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header]
        // Escape fields that contain commas, quotes, or newlines
        return typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      }).join(",")
    )
  ].join("\n")

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="registrations-export-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}

function generateExcelExport(data: any[]) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 })
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Auto-size columns
  const colWidths = Object.keys(data[0]).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
  }))
  worksheet['!cols'] = colWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="registrations-export-${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}

function generatePDFReport(data: any[], filters: any) {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  
  // Add title
  doc.setFontSize(16)
  doc.text('NAPPS Registration Report', 20, 20)
  
  // Add filter information
  doc.setFontSize(10)
  let yPos = 30
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos)
  yPos += 5
  
  if (filters.chapterId && filters.chapterId !== 'all') {
    doc.text(`Chapter Filter: Applied`, 20, yPos)
    yPos += 5
  }
  
  if (filters.dateFrom || filters.dateTo) {
    doc.text(`Date Range: ${filters.dateFrom || 'All'} to ${filters.dateTo || 'All'}`, 20, yPos)
    yPos += 5
  }
  
  doc.text(`Total Records: ${data.length}`, 20, yPos)
  yPos += 10

  // Prepare table data
  const tableHeaders = [
    'Reg. Number', 'Student Name', 'Chapter', 'School', 
    'Parent Name', 'Payment Status', 'Reg. Date'
  ]
  
  const tableData = data.map(row => [
    row['Registration Number'],
    `${row['First Name']} ${row['Last Name']}`,
    row['Chapter'],
    row['School'],
    `${row['Parent First Name']} ${row['Parent Last Name']}`,
    row['Payment Status'],
    row['Registration Date']
  ])

  // Add table using autoTable plugin
  ;(doc as any).autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 139, 34] },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  })

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="registrations-report-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  })
}
