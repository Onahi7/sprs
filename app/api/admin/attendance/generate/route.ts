import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { chapters, centers, registrations, subjects, chapterCoordinators, schools, supervisors } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { generateAttendancePDF } from "@/lib/attendance-pdf"

export async function POST(request: NextRequest) {
  try {
    const db = getDbConnection()

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const centerId = searchParams.get('centerId')

    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      )
    }

    // Fetch chapter details
    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, parseInt(chapterId)))
      .limit(1)

    if (!chapter.length) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    // Fetch coordinator details for the chapter
    const coordinator = await db
      .select()
      .from(chapterCoordinators)
      .where(eq(chapterCoordinators.chapterId, parseInt(chapterId)))
      .limit(1)

    // Fetch subjects (we'll assume there are standard subjects)
    const subjectsList = await db
      .select()
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(asc(subjects.name))

    let attendanceData

    if (centerId) {
      // Generate for specific center
      const center = await db
        .select()
        .from(centers)
        .where(and(
          eq(centers.id, parseInt(centerId)),
          eq(centers.chapterId, parseInt(chapterId))
        ))
        .limit(1)

      if (!center.length) {
        return NextResponse.json(
          { error: "Center not found" },
          { status: 404 }
        )
      }

      // Fetch students for this center
      const students = await db
        .select({
          id: registrations.id,
          registrationNumber: registrations.registrationNumber,
          firstName: registrations.firstName,
          middleName: registrations.middleName,
          lastName: registrations.lastName,
          schoolName: registrations.schoolName,
          schoolId: registrations.schoolId,
          paymentStatus: registrations.paymentStatus,
          createdAt: registrations.createdAt
        })
        .from(registrations)
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .where(and(
          eq(registrations.chapterId, parseInt(chapterId)),
          eq(registrations.centerId, parseInt(centerId)),
          eq(registrations.paymentStatus, "completed")
        ))
        .orderBy(asc(registrations.registrationNumber))

      // Fetch supervisor for this center
      const supervisor = await db
        .select()
        .from(supervisors)
        .where(and(
          eq(supervisors.centerId, parseInt(centerId)),
          eq(supervisors.isActive, true)
        ))
        .limit(1)

      attendanceData = {
        chapter: chapter[0],
        center: center[0],
        coordinator: coordinator[0] || null,
        supervisor: supervisor[0] || null,
        students,
        subjects: subjectsList,
        type: 'center' as const
      }
    } else {
      // Generate for all centers in chapter
      const centersInChapter = await db
        .select()
        .from(centers)
        .where(eq(centers.chapterId, parseInt(chapterId)))
        .orderBy(asc(centers.name))

      // Fetch students grouped by center
      const students = await db
        .select({
          id: registrations.id,
          registrationNumber: registrations.registrationNumber,
          firstName: registrations.firstName,
          middleName: registrations.middleName,
          lastName: registrations.lastName,
          schoolName: registrations.schoolName,
          schoolId: registrations.schoolId,
          centerId: registrations.centerId,
          paymentStatus: registrations.paymentStatus,
          createdAt: registrations.createdAt,
          centerName: centers.name
        })
        .from(registrations)
        .leftJoin(centers, eq(registrations.centerId, centers.id))
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .where(and(
          eq(registrations.chapterId, parseInt(chapterId)),
          eq(registrations.paymentStatus, "completed")
        ))
        .orderBy(asc(centers.name), asc(registrations.registrationNumber))

      attendanceData = {
        chapter: chapter[0],
        centers: centersInChapter,
        coordinator: coordinator[0] || null,
        supervisor: null, // For chapter-wide, supervisor will be fetched per center
        students,
        subjects: subjectsList,
        type: 'chapter' as const
      }
    }

    // Generate PDF
    const pdfBuffer = await generateAttendancePDF(attendanceData)

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Length', pdfBuffer.length.toString())
    
    const fileName = centerId 
      ? `attendance_${chapter[0].name.replace(/\s+/g, '_')}_${attendanceData.center?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `attendance_${chapter[0].name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`)

    return new NextResponse(pdfBuffer, { headers })

  } catch (error) {
    console.error("Error generating attendance PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate attendance list" },
      { status: 500 }
    )
  }
}
