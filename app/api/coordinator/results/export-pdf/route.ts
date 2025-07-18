import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db"
import { registrations, studentResults, subjects, centers, schools, chapterCoordinators } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import jsPDF from "jspdf"
// Import autoTable for jsPDF
import "jspdf-autotable"

// Define autoTable as a global function for jsPDF
declare global {
  interface Window {
    jspdf: any
  }
}

// Extend jsPDF to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || !session.id || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get request parameters
    const { searchParams } = new URL(request.url)
    const exportType = searchParams.get('type') || 'all'
    const centerId = searchParams.get('centerId')
    
    console.log(`Export PDF Request - Type: ${exportType}, CenterId: ${centerId}`)

    const db = getDbConnection()

    // Get coordinator info
    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.id, session.id),
      with: {
        chapter: true
      }
    })

    if (!coordinator) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    // Get all centers in the chapter
    const allCenters = await db.query.centers.findMany({
      where: eq(centers.chapterId, coordinator.chapterId!),
      orderBy: (centers, { asc }) => [asc(centers.name)]
    })

    // Build where clause for center filtering
    let centerFilter = eq(centers.chapterId, coordinator.chapterId!)
    if (centerId && centerId !== 'all') {
      try {
        const centerIdNum = parseInt(centerId)
        // Only apply the filter if we have a valid numeric centerId
        if (!isNaN(centerIdNum)) {
          centerFilter = eq(registrations.centerId, centerIdNum)
        }
      } catch (error) {
        console.error("Invalid centerId format:", centerId)
        // Continue with default chapter filter if centerId is invalid
      }
    }

    // Get all students with results from this coordinator's chapter
    const chapterResults = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        middleName: registrations.middleName,
        schoolName: sql<string>`COALESCE(${schools.name}, ${registrations.schoolName})`.as('schoolName'),
        centerName: centers.name,
        centerId: registrations.centerId,
        subjectId: studentResults.subjectId,
        subjectName: subjects.name,
        score: studentResults.score,
        grade: studentResults.grade,
        maxScore: subjects.maxScore
      })
      .from(registrations)
      .innerJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .innerJoin(studentResults, eq(registrations.id, studentResults.registrationId))
      .innerJoin(subjects, eq(studentResults.subjectId, subjects.id))
      .where(centerFilter)
      .orderBy(desc(registrations.createdAt))

    // Process results into student objects
    const studentsMap = new Map<number, any>()
    
    chapterResults.forEach(row => {
      if (!studentsMap.has(row.id)) {
        studentsMap.set(row.id, {
          id: row.id,
          registrationNumber: row.registrationNumber,
          firstName: row.firstName,
          lastName: row.lastName,
          middleName: row.middleName,
          schoolName: row.schoolName,
          centerName: row.centerName,
          centerId: row.centerId,
          results: [],
          totalScore: 0,
          totalMaxScore: 0,
          averagePercentage: 0,
          overallGrade: 'F'
        })
      }
      
      const student = studentsMap.get(row.id)
      student.results.push({
        subjectName: row.subjectName,
        score: row.score,
        grade: row.grade
      })
      student.totalScore += row.score
      student.totalMaxScore += row.maxScore
    })

    // Calculate averages and grades
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

    // Sort students by total score (descending)
    students.sort((a, b) => b.totalScore - a.totalScore)

    // Create PDF - A4 landscape
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })
    
    // Add a helper function for table creation if autoTable is not available
    const createTable = (doc: jsPDF, options: any) => {
      try {
        // Try to use the built-in autoTable method first
        if (typeof doc.autoTable === 'function') {
          return doc.autoTable(options)
        }
        
        // Fallback to manual table creation if autoTable is not available
        const { startY, head, body } = options
        const cellWidth = 25
        const cellHeight = 10
        const marginLeft = 10
        
        let yPos = startY || 20
        
        // Draw header
        doc.setFillColor(41, 128, 185)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        
        head[0].forEach((text: string, i: number) => {
          doc.rect(marginLeft + i * cellWidth, yPos, cellWidth, cellHeight, 'F')
          doc.text(text, marginLeft + i * cellWidth + cellWidth/2, yPos + cellHeight/2, { 
            align: 'center',
            baseline: 'middle'
          })
        })
        
        yPos += cellHeight
        
        // Draw body
        doc.setFillColor(255, 255, 255)
        doc.setTextColor(0, 0, 0)
        
        body.forEach((row: string[], rowIndex: number) => {
          // Alternate row colors
          if (rowIndex % 2 === 1) {
            doc.setFillColor(245, 245, 245)
          } else {
            doc.setFillColor(255, 255, 255)
          }
          
          row.forEach((text: string, i: number) => {
            doc.rect(marginLeft + i * cellWidth, yPos, cellWidth, cellHeight, 'F')
            doc.text(String(text), marginLeft + i * cellWidth + cellWidth/2, yPos + cellHeight/2, { 
              align: 'center',
              baseline: 'middle'
            })
          })
          
          yPos += cellHeight
        })
        
        return doc
      } catch (error) {
        console.error("Error creating table:", error)
        throw error
      }
    }

    // Add NAPPS logo (assuming it's available as base64 or file)
    const logoPath = '/napps-logo.svg'
    
    // PDF Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('NAPPS NASARAWA STATE', 148, 20, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('UNIFIED EXAMINATION RESULTS', 148, 30, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text(`Chapter: ${coordinator.chapter?.name || 'N/A'}`, 148, 40, { align: 'center' })
    
    if (centerId && centerId !== 'all') {
      const selectedCenter = allCenters.find(c => c.id === parseInt(centerId))
      doc.text(`Center: ${selectedCenter?.name || 'N/A'}`, 148, 50, { align: 'center' })
    }
    
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 148, centerId && centerId !== 'all' ? 60 : 50, { align: 'center' })

    let exportData: any[] = []
    let title = ''

    // Determine export data based on type
    if (exportType === 'center-best') {
      // Group students by center and get top 10 from each
      const centerGroups = new Map<string, any[]>()
      
      students.forEach(student => {
        const centerKey = `${student.centerId}-${student.centerName}`
        if (!centerGroups.has(centerKey)) {
          centerGroups.set(centerKey, [])
        }
        centerGroups.get(centerKey)!.push(student)
      })

      // Get top 10 from each center
      exportData = []
      centerGroups.forEach((centerStudents, centerKey) => {
        const [centerId, centerName] = centerKey.split('-', 2)
        const top10 = centerStudents.slice(0, 10)
        exportData.push({
          centerName,
          students: top10
        })
      })
      
      title = 'CENTER BEST PERFORMERS (TOP 10 PER CENTER)'
    } else if (exportType === 'chapter') {
      exportData = students.slice(0, 10)
      title = 'CHAPTER BEST PERFORMERS (TOP 10)'
    } else if (exportType === 'center') {
      exportData = students
      const selectedCenter = allCenters.find(c => c.id === parseInt(centerId || '0'))
      title = `CENTER RESULTS - ${selectedCenter?.name || 'Selected Center'}`
    } else {
      exportData = students
      title = 'ALL STUDENTS RESULTS'
    }

    // Start content at appropriate Y position
    let yPosition = centerId && centerId !== 'all' ? 70 : 60

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 148, yPosition, { align: 'center' })
    yPosition += 10

    if (exportType === 'center-best') {
      // Special handling for center-best export
      exportData.forEach((centerData, index) => {
        if (index > 0) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`${centerData.centerName} - TOP 10`, 148, yPosition, { align: 'center' })
        yPosition += 10

        const tableData = centerData.students.map((student: any, idx: number) => [
          idx + 1,
          student.registrationNumber,
          `${student.firstName} ${student.lastName}`,
          student.schoolName,
          student.totalScore,
          student.totalMaxScore,
          `${student.averagePercentage.toFixed(1)}%`,
          student.overallGrade
        ])

        createTable(doc, {
          startY: yPosition,
          head: [['Pos', 'Reg. No.', 'Pupil Name', 'School', 'Score', 'Max Score', 'Percentage', 'Grade']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        })

        yPosition = (doc as any).lastAutoTable?.finalY + 20 || yPosition + (tableData.length + 1) * 10
      })
    } else {
      // Regular table export
      const tableData = exportData.map((student: any, index: number) => [
        index + 1,
        student.registrationNumber,
        `${student.firstName} ${student.lastName}`,
        student.schoolName,
        student.centerName,
        student.totalScore,
        student.totalMaxScore,
        `${student.averagePercentage.toFixed(1)}%`,
        student.overallGrade
      ])

      createTable(doc, {
        startY: yPosition,
        head: [['Pos', 'Reg. No.', 'Pupil Name', 'School', 'Center', 'Score', 'Max Score', 'Percentage', 'Grade']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      })
    }

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 148, 205, { align: 'center' })
      doc.text('NAPPS Nasarawa State - Unified Examination System', 148, 200, { align: 'center' })
    }

    const pdfOutput = doc.output('arraybuffer')
    const filename = `${coordinator.chapter?.name || 'chapter'}-${exportType}-results.pdf`

    return new NextResponse(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error("Error exporting coordinator results:", error)
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    )
  }
}
