import { NextResponse } from "next/server"
import { db } from "@/db"
import { studentResults, registrations, subjects } from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateResultSlipPDF } from "@/lib/pdf"

export async function GET(request: Request, { params }: { params: { registrationNumber: string } }) {
  try {
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
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Get student results
    const results = await db
      .select({
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

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "No results found for this student" }, { status: 404 })
    }

    // Calculate center position
    let centerPosition = 0
    if (registration.centerId) {
      try {
        // Get all results for students in the same center
        const centerResults = await db
          .select({
            registrationId: studentResults.registrationId,
            score: studentResults.score,
            registration: {
              centerId: registrations.centerId
            }
          })
          .from(studentResults)
          .innerJoin(registrations, eq(studentResults.registrationId, registrations.id))
          .where(eq(registrations.centerId, registration.centerId))

        // Group by student and calculate totals
        const studentTotals: { [key: number]: number } = {}
        centerResults.forEach(result => {
          if (!studentTotals[result.registrationId]) {
            studentTotals[result.registrationId] = 0
          }
          studentTotals[result.registrationId] += result.score
        })

        // Calculate current student's total
        const currentTotal = results.reduce((sum, result) => sum + result.score, 0)

        // Sort and find position
        const sortedTotals = Object.values(studentTotals).sort((a, b) => b - a)
        centerPosition = sortedTotals.findIndex(total => total <= currentTotal) + 1
      } catch (error) {
        console.warn("Could not calculate center position:", error)
      }
    }

    // Process results for PDF generation
    const resultsBySubject: { [subjectId: number]: { score: number; grade: string } } = {}
    const subjectsData: Array<{ id: number; name: string; maxScore: number }> = []

    results.forEach(result => {
      resultsBySubject[result.subjectId] = {
        score: result.score,
        grade: result.grade
      }
      
      // Add subject if not already added
      if (!subjectsData.find(s => s.id === result.subjectId)) {
        subjectsData.push({
          id: result.subject.id,
          name: result.subject.name,
          maxScore: result.subject.maxScore
        })
      }
    })

    const totalScore = results.reduce((sum, result) => sum + result.score, 0)
    const totalMaxScore = results.reduce((sum, result) => sum + result.subject.maxScore, 0)
    const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
    
    // Calculate overall grade
    let overallGrade = "F"
    if (averagePercentage >= 80) overallGrade = "A"
    else if (averagePercentage >= 70) overallGrade = "B"
    else if (averagePercentage >= 60) overallGrade = "C"
    else if (averagePercentage >= 50) overallGrade = "D"
    else if (averagePercentage >= 40) overallGrade = "E"

    const resultSlipData = {
      student: {
        registrationNumber: registration.registrationNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        middleName: registration.middleName,
        class: registration.class || "N/A",
        centerName: registration.center?.name || "N/A",
        chapterName: registration.chapter?.name || "N/A",
        schoolName: registration.schoolName || registration.school?.name || "N/A",
        passportUrl: registration.passportUrl
      },
      subjects: subjectsData,
      results: resultsBySubject,
      totalScore,
      totalMaxScore,
      averagePercentage,
      overallGrade,
      centerPosition
    }

    // Generate PDF
    const pdfBuffer = await generateResultSlipPDF(resultSlipData)

    // Set headers for PDF download
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="result-slip-${registrationNumber}.pdf"`)

    return new NextResponse(Uint8Array.from(pdfBuffer), {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error("Error generating result slip:", error)
    return NextResponse.json({ error: "Failed to generate result slip" }, { status: 500 })
  }
}
