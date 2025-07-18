import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db"
import { registrations, studentResults, subjects, centers, schools, chapterCoordinators } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || !session.id || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Get chapter best 10 (top 10 in the chapter)
    const chapterBest = students.slice(0, 10)

    // Get center best 10 (top performers across all centers)
    const centerBest = students.slice(0, 10)

    // Get center information for this chapter
    const chapterCenters = await db.query.centers.findMany({
      where: eq(centers.chapterId, coordinator.chapterId!),
      columns: {
        id: true,
        name: true
      }
    })

    return NextResponse.json({
      students,
      chapterBest,
      centerBest,
      centers: chapterCenters,
      coordinator: {
        id: coordinator.id,
        name: coordinator.name,
        chapterId: coordinator.chapterId,
        chapterName: coordinator.chapter?.name
      }
    })

  } catch (error) {
    console.error("Error fetching coordinator results:", error)
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    )
  }
}
