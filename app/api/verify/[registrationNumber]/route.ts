
import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { registrations, studentResults, subjects, chapters, centers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request, { params }: { params: { registrationNumber: string } }) {
  try {
    const db = getDbConnection()
    
    const { registrationNumber } = await params
    
    if (!registrationNumber) {
      return NextResponse.json({ error: "Registration number is required" }, { status: 400 })
    }


    // Get registration details
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.registrationNumber, registrationNumber),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ 
        isValid: false,
        error: "Registration not found" 
      }, { status: 404 })
    }

    // Get student results
    const results = await db.select({
      id: studentResults.id,
      registrationId: studentResults.registrationId,
      subjectId: studentResults.subjectId,
      score: studentResults.score,
      grade: studentResults.grade,
      subject: {
        id: subjects.id,
        name: subjects.name,
        code: subjects.code,
        maxScore: subjects.maxScore
      }
    })
      .from(studentResults)
      .innerJoin(subjects, eq(studentResults.subjectId, subjects.id))
      .where(eq(studentResults.registrationId, registration.id))

    // Calculate center position if results exist
    let centerPosition = 0
    if (results.length > 0 && registration.centerId) {
      try {
        const centerResults = await db.select({
          registrationId: studentResults.registrationId,
          score: studentResults.score
        })
          .from(studentResults)
          .innerJoin(registrations, eq(studentResults.registrationId, registrations.id))
          .where(eq(registrations.centerId, registration.centerId))

        const studentTotals: { [key: number]: number } = {}
        centerResults?.forEach((result: any) => {
          if (!studentTotals[result.registrationId]) {
            studentTotals[result.registrationId] = 0
          }
          studentTotals[result.registrationId] += result.score
        })

        const currentTotal = results.reduce((sum: number, result: any) => sum + result.score, 0)
        const sortedTotals = Object.values(studentTotals).sort((a, b) => b - a)
        centerPosition = sortedTotals.findIndex(total => total <= currentTotal) + 1
      } catch (error) {
        console.warn("Could not calculate center position:", error)
      }
    }

    // Prepare response

    // Always include results (null if not available)
    let resultsData: any = null
    if (results.length > 0) {
      const resultsBySubject: { [subjectId: number]: { score: number; grade: string } } = {}
      const subjectsData: Array<{ id: number; name: string; maxScore: number }> = []

      results.forEach((result: any) => {
        resultsBySubject[result.subjectId] = {
          score: result.score,
          grade: result.grade || ""
        }
        if (!subjectsData.find((s: any) => s.id === result.subjectId)) {
          subjectsData.push({
            id: result.subject.id,
            name: result.subject.name,
            maxScore: result.subject.maxScore
          })
        }
      })

      const totalScore = results.reduce((sum: number, result: any) => sum + result.score, 0)
      const totalMaxScore = results.reduce((sum: number, result: any) => sum + result.subject.maxScore, 0)
      const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
      let overallGrade = "F"
      if (averagePercentage >= 80) overallGrade = "A"
      else if (averagePercentage >= 70) overallGrade = "B"
      else if (averagePercentage >= 60) overallGrade = "C"
      else if (averagePercentage >= 50) overallGrade = "D"
      else if (averagePercentage >= 40) overallGrade = "E"

      resultsData = {
        subjects: subjectsData,
        scores: resultsBySubject,
        totalScore,
        totalMaxScore,
        averagePercentage,
        overallGrade,
        centerPosition: centerPosition > 0 ? centerPosition : undefined
      }
    }

    const verificationResult = {
      isValid: true,
      student: {
        registrationNumber: registration.registrationNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        middleName: registration.middleName,
        centerName: registration.center?.name || "N/A",
        chapterName: registration.chapter?.name || "N/A",
        schoolName: registration.schoolName || registration.school?.name || "N/A",
        passportUrl: registration.passportUrl
      },
      verification: {
        verifiedAt: new Date().toISOString(),
        examDate: "06/06/2024",
        issuedBy: "NAPPS Nasarawa State Chapter"
      },
      results: resultsData
    }

    return NextResponse.json(verificationResult)

  } catch (error) {
    console.error("Error verifying registration:", error)
    return NextResponse.json({ 
      isValid: false,
      error: "Verification failed" 
    }, { status: 500 })
  }
}
