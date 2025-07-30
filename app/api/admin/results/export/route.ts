import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db"
import { registrations, studentResults, subjects, chapters, schools, centers } from "@/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(5000) 
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/png'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.warn('Failed to load image:', error)
    throw error
  }
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

type StudentResultData = {
  registrationNumber: string
  firstName: string
  lastName: string
  middleName?: string
  schoolName: string
  chapterName: string
  class: string
  results: Array<{
    subjectName: string
    subjectCode: string
    score: number
    grade: string
    maxScore: number
  }>
  totalScore: number
  totalMaxScore: number
  averagePercentage: number
  overallGrade: string
  position: number
}

export async function GET(request: Request) {
  try {
    console.log('Export API called:', request.url)
    
    const session = await getSession()
    console.log('Session check:', session ? 'valid' : 'invalid')
    
    if (!session || !session.id || session.role !== "admin") {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const type = searchParams.get('type') || 'all' // all, best10, chapter-best
    const chapterId = searchParams.get('chapterId')
    
    console.log('Export params:', { format, type, chapterId })

    console.log('Getting database connection...')
    let db
    try {
      db = getDbConnection()
      console.log('Database connection obtained')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Get all students with results
    console.log('Building database query...')
    let whereConditions = [eq(registrations.paymentStatus, "completed")]
    if (chapterId) {
      whereConditions.push(eq(chapters.id, parseInt(chapterId)))
    }

    console.log('Executing database query...')
    let allResults
    try {
      allResults = await db
        .select({
          registrationId: registrations.id,
          registrationNumber: registrations.registrationNumber,
          firstName: registrations.firstName,
          lastName: registrations.lastName,
          middleName: registrations.middleName,
          schoolName: sql<string>`COALESCE(${schools.name}, ${registrations.schoolName})`.as('schoolName'),
          chapterName: chapters.name,
          chapterId: chapters.id,
          subjectId: studentResults.subjectId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          score: studentResults.score,
          grade: studentResults.grade,
          maxScore: subjects.maxScore
        })
        .from(registrations)
        .innerJoin(chapters, eq(registrations.chapterId, chapters.id))
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .innerJoin(studentResults, eq(registrations.id, studentResults.registrationId))
        .innerJoin(subjects, eq(studentResults.subjectId, subjects.id))
        .where(and(...whereConditions))
        .orderBy(desc(registrations.createdAt))
    } catch (queryError) {
      console.error('Database query failed:', queryError)
      return NextResponse.json({ error: "Database query failed: " + (queryError instanceof Error ? queryError.message : String(queryError)) }, { status: 500 })
    }

    console.log(`Query executed, found ${allResults.length} results`)

    // Process results into student objects
    console.log('Processing results into student objects...')
    const studentsMap = new Map<number, StudentResultData>()
    
    allResults.forEach(row => {
      if (!studentsMap.has(row.registrationId)) {
        studentsMap.set(row.registrationId, {
          registrationNumber: row.registrationNumber,
          firstName: row.firstName,
          lastName: row.lastName,
          middleName: row.middleName || undefined,
          schoolName: row.schoolName,
          chapterName: row.chapterName,
          class: 'N/A', // Default class since it's not in the schema
          results: [],
          totalScore: 0,
          totalMaxScore: 0,
          averagePercentage: 0,
          overallGrade: 'F',
          position: 0
        })
      }
      
      const student = studentsMap.get(row.registrationId)!
      student.results.push({
        subjectName: row.subjectName,
        subjectCode: row.subjectCode,
        score: row.score,
        grade: row.grade || 'F',
        maxScore: row.maxScore
      })
      student.totalScore += row.score
      student.totalMaxScore += row.maxScore
    })

    // Calculate averages, grades, and positions
    const students = Array.from(studentsMap.values()).map(student => {
      student.averagePercentage = student.totalMaxScore > 0 ? (student.totalScore / student.totalMaxScore) * 100 : 0
      
      // Calculate overall grade
      if (student.averagePercentage >= 80) student.overallGrade = 'A'
      else if (student.averagePercentage >= 70) student.overallGrade = 'B'
      else if (student.averagePercentage >= 60) student.overallGrade = 'C'
      else if (student.averagePercentage >= 50) student.overallGrade = 'D'
      else if (student.averagePercentage >= 40) student.overallGrade = 'E'
      else student.overallGrade = 'F'
      
      return student
    })

    // Sort by total score and average percentage (descending)
    students.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore
      }
      return b.averagePercentage - a.averagePercentage
    })

    // Assign positions
    students.forEach((student, index) => {
      student.position = index + 1
    })

    console.log(`Processed ${students.length} students`)

    // Filter based on type
    console.log('Filtering data based on type:', type)
    let exportData = students
    let filename = 'napps-results-export'

    switch (type) {
      case 'best10':
        exportData = students.slice(0, 10)
        filename = 'napps-overall-best-10'
        break
      case 'chapter-best':
        // Group by chapter and get top 10 from each
        const chapterGroups = new Map<string, StudentResultData[]>()
        students.forEach(student => {
          if (!chapterGroups.has(student.chapterName)) {
            chapterGroups.set(student.chapterName, [])
          }
          chapterGroups.get(student.chapterName)!.push(student)
        })
        
        exportData = []
        chapterGroups.forEach((chapterStudents, chapterName) => {
          const top10 = chapterStudents.slice(0, 10)
          // Reset positions within chapter
          top10.forEach((student, index) => {
            student.position = index + 1
          })
          exportData.push(...top10)
        })
        filename = 'napps-chapter-best-10'
        break
      default:
        filename = 'napps-all-results'
        break
    }

    console.log(`Export data prepared: ${exportData.length} records, format: ${format}`)

    if (format === 'pdf') {
      console.log('Generating PDF export...')
      return generatePDFExport(exportData, type, filename)
    } else {
      console.log('Generating CSV export...')
      return generateCSVExport(exportData, filename)
    }

  } catch (error) {
    console.error("Error exporting results:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: "Failed to export results: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}

function generateCSVExport(data: StudentResultData[], filename: string) {
  try {
    console.log('Generating CSV export for', data.length, 'records')
    
    if (data.length === 0) {
      console.log('No data to export')
      return NextResponse.json({ error: "No data to export" }, { status: 400 })
    }

  // Get all unique subjects from the data
  const allSubjects = new Set<string>()
  data.forEach(student => {
    student.results.forEach(result => {
      allSubjects.add(result.subjectCode)
    })
  })
  const subjectsList = Array.from(allSubjects).sort()

  const csvHeaders = [
    'Position',
    'Registration Number',
    'Student Name',
    'School Name',
    'Chapter',
    ...subjectsList.map(code => `${code} Score`),
    'Total Score',
    'Average %',
    'Overall Grade'
  ]

  const csvRows = data.map(student => {
    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim()
    
    const row = [
      student.position,
      student.registrationNumber,
      `"${fullName}"`,
      `"${student.schoolName}"`,
      `"${student.chapterName}"`,
      ...subjectsList.map(subjectCode => {
        const result = student.results.find(r => r.subjectCode === subjectCode)
        return result ? result.score : ''
      }),
      student.totalScore,
      student.averagePercentage.toFixed(1),
      student.overallGrade
    ]
    
    return row.join(',')
  })

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows
  ].join('\n')

  console.log('CSV generated successfully')
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
  
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
  }
}

async function generatePDFExport(data: StudentResultData[], type: string, filename: string) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Colors matching attendance sheet
    const nappsGreen: [number, number, number] = [0, 128, 55]
    const white: [number, number, number] = [255, 255, 255]
    const black: [number, number, number] = [0, 0, 0]
    const headerGray: [number, number, number] = [240, 240, 240]
    const borderGray: [number, number, number] = [200, 200, 200]

    // Page dimensions (landscape)
    const pageWidth = 297
    const margin = 15

    await addPDFHeader(doc, nappsGreen, white, black, pageWidth, margin, type)

    // Get unique subjects
    const allSubjects = new Set<string>()
    data.forEach(student => {
      student.results.forEach(result => {
        allSubjects.add(result.subjectCode)
      })
    })
    const subjectsList = Array.from(allSubjects).sort()

    // Prepare table headers
    const headers = [
      'Pos.',
      'Reg. No.',
      'Student Name',
      'School',
      ...subjectsList.slice(0, 4), // Limit subjects to fit page
      'Total',
      'Avg %',
      'Grade'
    ]

    // Prepare table data
    const tableData = data.map(student => {
      const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase()
      
      const row = [
        student.position.toString(),
        student.registrationNumber,
        fullName,
        student.schoolName,
        ...subjectsList.slice(0, 4).map(subjectCode => {
          const result = student.results.find(r => r.subjectCode === subjectCode)
          return result ? result.score.toString() : '-'
        }),
        student.totalScore.toString(),
        `${student.averagePercentage.toFixed(1)}%`,
        student.overallGrade
      ]
      
      return row
    })

    // Generate table
    ;(doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 60,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: borderGray,
        lineWidth: 0.3
      },
      headStyles: {
        fillColor: nappsGreen,
        textColor: white,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // Position
        1: { halign: 'center', cellWidth: 25 }, // Reg No
        2: { halign: 'left', cellWidth: 45 }, // Name
        3: { halign: 'left', cellWidth: 35 }, // School
        // Subject scores - auto width
        [4 + subjectsList.slice(0, 4).length]: { halign: 'center', cellWidth: 20 }, // Total
        [4 + subjectsList.slice(0, 4).length + 1]: { halign: 'center', cellWidth: 20 }, // Avg %
        [4 + subjectsList.slice(0, 4).length + 2]: { halign: 'center', cellWidth: 15 }, // Grade
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      tableLineColor: borderGray,
      tableLineWidth: 0.3,
      showHead: 'everyPage',
      pageBreak: 'auto',
      theme: 'grid'
    })

    // Add footer
    const finalY = (doc as any).lastAutoTable.finalY + 20
    addPDFFooter(doc, finalY, margin, pageWidth, nappsGreen)

    const pdfOutput = doc.output('arraybuffer')
    const buffer = Buffer.from(pdfOutput)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}

async function addPDFHeader(
  doc: jsPDF,
  nappsGreen: [number, number, number],
  white: [number, number, number],
  black: [number, number, number],
  pageWidth: number,
  margin: number,
  type: string
) {
  const logoX = margin
  const logoY = margin
  const logoSize = 25

  try {
    // Load the actual NAPPS logo
    const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png'
    const logoBase64 = await imageUrlToBase64(logoUrl)
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize)
  } catch (error) {
    console.warn('Could not load logo, using fallback:', error)
    // Fallback logo design
    doc.setFillColor(...nappsGreen)
    doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'F')
    
    doc.setTextColor(...white)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('NAPPS', logoX + logoSize/2, logoY + logoSize/2 + 2, { align: 'center' })
  }

  // Title section - right aligned
  const titleX = pageWidth - margin
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('NAPPS NASARAWA STATE', titleX, logoY + 5, { align: 'right' })
  
  doc.setFontSize(14)
  doc.text('UNIFIED EXAMS 2025', titleX, logoY + 12, { align: 'right' })
  
  doc.setFontSize(12)
  doc.setTextColor(...black)
  
  let reportTitle = 'EXAMINATION RESULTS'
  if (type === 'best10') reportTitle = 'OVERALL BEST 10 PERFORMERS'
  else if (type === 'chapter-best') reportTitle = 'CHAPTER BEST PERFORMERS'
  
  doc.text(reportTitle, titleX, logoY + 19, { align: 'right' })

  // Date
  const today = new Date().toLocaleDateString('en-GB')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${today}`, titleX, logoY + 26, { align: 'right' })
}

function addPDFFooter(
  doc: jsPDF,
  yPos: number,
  margin: number,
  pageWidth: number,
  nappsGreen: [number, number, number]
) {
  const footerY = yPos + 15
  
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('National Association of Proprietors of Private Schools - Nasarawa State Chapter', pageWidth / 2, footerY, { align: 'center' })
  
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7)
  doc.text('This is an official document generated by NAPPS Results Management System', pageWidth / 2, footerY + 5, { align: 'center' })
}
