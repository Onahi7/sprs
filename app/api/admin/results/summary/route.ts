import { NextResponse } from "next/server"
import { db } from "../../../../../db"
import { registrations, studentResults, subjects, chapters, centers, schools } from "../../../../../db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    // Check if database connection is available
    if (!db) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }
    
    // Get all registrations with their chapters and centers
    const allRegistrations = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        lastName: registrations.lastName,
        chapterId: registrations.chapterId,
        centerId: registrations.centerId,
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

    // Get all student results
    const allResults = await db
      .select({
        registrationId: studentResults.registrationId,
        score: studentResults.score,
        subjectId: studentResults.subjectId,
        subject: {
          maxScore: subjects.maxScore
        }
      })
      .from(studentResults)
      .innerJoin(subjects, eq(studentResults.subjectId, subjects.id))

    // Group results by registration
    const resultsByRegistration: { [key: number]: Array<{ score: number; maxScore: number }> } = {}
    allResults.forEach((result: any) => {
      const regId = result.registrationId
      if (regId !== null) {
        if (!resultsByRegistration[regId]) {
          resultsByRegistration[regId] = []
        }
        resultsByRegistration[regId].push({
          score: result.score,
          maxScore: result.subject.maxScore
        })
      }
    })

    // Calculate totals
    const totalRegistrations = allRegistrations.length
    const totalWithResults = Object.keys(resultsByRegistration).length
    const totalWithoutResults = totalRegistrations - totalWithResults

    // Group by chapters
    const chapterGroups: { [key: number]: any } = {}
    
    allRegistrations.forEach((reg: any) => {
      const chapterId = reg.chapterId || 0
      const chapterName = reg.chapter?.name || 'No Chapter'
      const centerId = reg.centerId || 0
      const centerName = reg.center?.name || 'No Center'

      if (!chapterGroups[chapterId]) {
        chapterGroups[chapterId] = {
          id: chapterId,
          name: chapterName,
          totalRegistrations: 0,
          withResults: 0,
          withoutResults: 0,
          centers: {}
        }
      }

      if (!chapterGroups[chapterId].centers[centerId]) {
        chapterGroups[chapterId].centers[centerId] = {
          id: centerId,
          name: centerName,
          totalRegistrations: 0,
          withResults: 0,
          withoutResults: 0,
          topPerformers: []
        }
      }

      // Count registrations
      chapterGroups[chapterId].totalRegistrations++
      chapterGroups[chapterId].centers[centerId].totalRegistrations++

      // Check if has results
      if (reg.id !== null && resultsByRegistration[reg.id]) {
        chapterGroups[chapterId].withResults++
        chapterGroups[chapterId].centers[centerId].withResults++

        // Calculate student performance for top performers
        const studentResults = resultsByRegistration[reg.id]
        const totalScore = studentResults.reduce((sum, r) => sum + r.score, 0)
        const totalMaxScore = studentResults.reduce((sum, r) => sum + r.maxScore, 0)
        const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

        chapterGroups[chapterId].centers[centerId].topPerformers.push({
          registrationNumber: reg.registrationNumber,
          studentName: `${reg.firstName} ${reg.lastName}`,
          totalScore,
          averagePercentage
        })
      } else {
        chapterGroups[chapterId].withoutResults++
        chapterGroups[chapterId].centers[centerId].withoutResults++
      }
    })

    // Sort top performers and convert centers object to array
    const chaptersSummary = Object.values(chapterGroups).map((chapter: any) => ({
      ...chapter,
      centers: Object.values(chapter.centers).map((center: any) => ({
        ...center,
        topPerformers: center.topPerformers
          .sort((a: any, b: any) => b.totalScore - a.totalScore)
          .slice(0, 10)
      }))
    }))

    const summary = {
      totalRegistrations,
      totalWithResults,
      totalWithoutResults,
      chaptersSummary
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error("Error fetching results summary:", error)
    return NextResponse.json({ error: "Failed to fetch results summary" }, { status: 500 })
  }
}
