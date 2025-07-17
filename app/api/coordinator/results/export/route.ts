import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db"
import { registrations, studentResults, subjects, centers, schools, chapterCoordinators } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || !session.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exportType = searchParams.get('type') || 'all'

    const db = getDbConnection()

    // Get coordinator info
    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.email, session.email),
      with: {
        chapter: true
      }
    })

    if (!coordinator) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
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
      .where(eq(centers.chapterId, coordinator.chapterId!))
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

    let exportData: any[] = []
    let filename = `${coordinator.chapter?.name || 'chapter'}-results-${exportType}.csv`
    let csvContent = ''

    switch (exportType) {
      case 'performance':
        // Generate performance summary
        const totalStudents = students.length
        const totalScore = students.reduce((sum, student) => sum + student.averagePercentage, 0)
        const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0
        const passCount = students.filter(student => student.averagePercentage >= 40).length
        const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0
        
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
        students.forEach(student => {
          gradeDistribution[student.overallGrade as keyof typeof gradeDistribution]++
        })
        
        const performanceData = [
          ['Metric', 'Value'],
          ['Chapter Name', coordinator.chapter?.name || 'N/A'],
          ['Total Students', totalStudents],
          ['Average Score', `${averageScore.toFixed(1)}%`],
          ['Pass Rate (40% and above)', `${passRate.toFixed(1)}%`],
          ['Grade A Count', gradeDistribution.A],
          ['Grade B Count', gradeDistribution.B],
          ['Grade C Count', gradeDistribution.C],
          ['Grade D Count', gradeDistribution.D],
          ['Grade E Count', gradeDistribution.E],
          ['Grade F Count', gradeDistribution.F],
          ['Top Performer', students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'N/A'],
          ['Top Score', students[0] ? `${students[0].averagePercentage.toFixed(1)}%` : 'N/A'],
          ['Export Date', new Date().toISOString().split('T')[0]]
        ]
        
        csvContent = performanceData.map(row => row.map(field => `"${field}"`).join(',')).join('\n')
        filename = `${coordinator.chapter?.name || 'chapter'}-performance-summary.csv`
        break
        
      case 'chapter':
        exportData = students.slice(0, 10)
        filename = `${coordinator.chapter?.name || 'chapter'}-best-10.csv`
        break
        
      case 'center':
        exportData = students.slice(0, 10)
        filename = `${coordinator.chapter?.name || 'chapter'}-center-best-10.csv`
        break
        
      case 'all':
      default:
        exportData = students
        filename = `${coordinator.chapter?.name || 'chapter'}-all-results.csv`
        break
    }

    // Generate CSV content for non-performance exports
    if (exportType !== 'performance') {
      const csvHeaders = [
        'Position',
        'Registration Number',
        'First Name',
        'Last Name',
        'Middle Name',
        'School Name',
        'Center Name',
        'Total Score',
        'Total Max Score',
        'Percentage',
        'Overall Grade'
      ]

      const csvRows = exportData.map((student, index) => [
        index + 1,
        student.registrationNumber,
        student.firstName,
        student.lastName,
        student.middleName || '',
        student.schoolName,
        student.centerName,
        student.totalScore,
        student.totalMaxScore,
        student.averagePercentage.toFixed(1),
        student.overallGrade
      ])

      csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n')
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
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
