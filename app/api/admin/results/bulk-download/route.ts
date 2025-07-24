import { NextRequest, NextResponse } from "next/server"
import { db } from "../../../../../db"
import { registrations, studentResults, subjects, chapters, centers } from "../../../../../db/schema"
import { eq, and } from "drizzle-orm"
import { generateResultSlipPDF } from "../../../../../lib/pdf"
import JSZip from "jszip"

export async function GET(request: NextRequest) {
  try {
    // Check if database connection is available
    if (!db) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const centerId = searchParams.get('centerId')

    // Build query conditions
    let whereConditions: any[] = []
    
    if (centerId) {
      whereConditions.push(eq(registrations.centerId, parseInt(centerId)))
    } else if (chapterId) {
      whereConditions.push(eq(registrations.chapterId, parseInt(chapterId)))
    }

    // Get registrations based on filters
    const registrationsQuery = db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        middleName: registrations.middleName,
        chapterId: registrations.chapterId,
        centerId: registrations.centerId,
        schoolId: registrations.schoolId,
        schoolName: registrations.schoolName,
        passportUrl: registrations.passportUrl,
        chapter: {
          id: chapters.id,
          name: chapters.name
        },
        center: {
          id: centers.id,
          name: centers.name
        }
      })
      .from(registrations)
      .leftJoin(chapters, eq(registrations.chapterId, chapters.id))
      .leftJoin(centers, eq(registrations.centerId, centers.id))

    if (whereConditions.length > 0) {
      registrationsQuery.where(and(...whereConditions))
    }

    const selectedRegistrations = await registrationsQuery

    // Get all subjects
    const allSubjects = await db.select().from(subjects)

    // Create ZIP file
    const zip = new JSZip()
    const resultsFolder = zip.folder("result-slips")
    
    let processedCount = 0
    let skippedCount = 0

    for (const registration of selectedRegistrations) {
      try {
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
          .where(eq(studentResults.registrationId, registration.id || 0))

        if (results.length === 0) {
          skippedCount++
          continue // Skip students without results
        }        // Calculate center position (simplified for bulk generation)
        let centerPosition = 0
        if (registration.centerId) {
          try {
              const centerResults = await db
                .select({
                  registrationId: studentResults.registrationId,
                  score: studentResults.score
                })
                .from(studentResults)
                .innerJoin(registrations, eq(studentResults.registrationId, registrations.id))
                .where(eq(registrations.centerId, registration.centerId))

              const studentTotals: { [key: number]: number } = {}
            centerResults.forEach(result => {
              if (result.registrationId !== null) {
                if (!studentTotals[result.registrationId]) {
                  studentTotals[result.registrationId] = 0
                }
                studentTotals[result.registrationId] += result.score
              }
            })

            const currentTotal = results.reduce((sum, result) => sum + result.score, 0)
            const sortedTotals = Object.values(studentTotals).sort((a, b) => b - a)
            centerPosition = sortedTotals.findIndex(total => total <= currentTotal) + 1
          } catch (error) {
            console.warn("Could not calculate center position for bulk download:", error)
          }
        }

        // Prepare data for PDF generation
        const resultsBySubject: { [subjectId: number]: { score: number; grade: string } } = {}
        const subjectsData: Array<{ id: number; name: string; maxScore: number }> = []

        results.forEach(result => {
          if (result.subjectId !== null) {
            resultsBySubject[result.subjectId] = {
              score: result.score,
              grade: result.grade || ""
            }
            
            if (!subjectsData.find(s => s.id === result.subjectId)) {
              subjectsData.push({
                id: result.subject.id,
                name: result.subject.name,
                maxScore: result.subject.maxScore
              })
            }
          }
        })

        const totalScore = results.reduce((sum, result) => sum + result.score, 0)
        const totalMaxScore = results.reduce((sum, result) => sum + result.subject.maxScore, 0)
        const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

        const resultSlipData = {
          student: {
            registrationNumber: registration.registrationNumber,
            firstName: registration.firstName,
            lastName: registration.lastName,
            middleName: registration.middleName || undefined,
            class: "N/A",
            centerName: registration.center?.name || "N/A",
            chapterName: registration.chapter?.name || "N/A",
            schoolName: registration.schoolName || "N/A",
            passportUrl: registration.passportUrl
          },
          subjects: subjectsData,
          results: resultsBySubject,
          totalScore,
          totalMaxScore,
          averagePercentage,
          centerPosition
        }

        // Generate PDF
        const pdfBuffer = await generateResultSlipPDF(resultSlipData)
        
        // Add to ZIP
        const fileName = `${registration.registrationNumber}-${registration.firstName}-${registration.lastName}.pdf`
        resultsFolder?.file(fileName, pdfBuffer)
        
        processedCount++

      } catch (error) {
        console.error(`Error generating PDF for ${registration.registrationNumber}:`, error)
        skippedCount++
      }
    }

    if (processedCount === 0) {
      return NextResponse.json({ error: "No results available for download" }, { status: 404 })
    }

    // Add summary file
    const summaryContent = `Results Bulk Download Summary
Generated: ${new Date().toISOString()}
Filter: ${centerId ? `Center ID ${centerId}` : chapterId ? `Chapter ID ${chapterId}` : 'All Results'}
Total Registrations Found: ${selectedRegistrations.length}
PDFs Generated: ${processedCount}
Skipped (No Results): ${skippedCount}

Note: Only students with completed results are included in this download.
For verification, visit: https://exams.nappsnasarawa.com/verify/[registration-number]
`

    zip.file("download-summary.txt", summaryContent)

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" })

    // Set headers for ZIP download
    const headers = new Headers()
    headers.set("Content-Type", "application/zip")
    headers.set("Content-Disposition", `attachment; filename="napps-results-bulk-${new Date().toISOString().split('T')[0]}.zip"`)

    return new NextResponse(Uint8Array.from(Buffer.from(zipBuffer)), {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error("Error generating bulk download:", error)
    return NextResponse.json({ error: "Failed to generate bulk download" }, { status: 500 })
  }
}
