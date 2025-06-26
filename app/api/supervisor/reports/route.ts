import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { 
  examSessions, 
  studentAttendance, 
  registrations, 
  supervisors,
  schools
} from '@/db/schema'
import { eq, and, gte, desc, sql } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  supervisorId: number
  centerId: number
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: JWTPayload
    
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '7' // days
    const sessionId = searchParams.get('sessionId')

    // If requesting specific session details
    if (sessionId) {
      const sessionStudents = await db
        .select({
          registrationNumber: registrations.registrationNumber,
          firstName: registrations.firstName,
          middleName: registrations.middleName,
          lastName: registrations.lastName,
          schoolName: schools.name,
          attendanceStatus: studentAttendance.attendanceStatus,
          arrivalTime: studentAttendance.arrivalTime,
          departureTime: studentAttendance.departureTime,
          notes: studentAttendance.notes,
          markedAt: studentAttendance.markedAt,
        })
        .from(examSessions)
        .innerJoin(registrations, and(
          eq(registrations.centerId, examSessions.centerId),
          eq(registrations.isPaid, true)
        ))
        .leftJoin(schools, eq(schools.id, registrations.schoolId))
        .leftJoin(studentAttendance, and(
          eq(studentAttendance.registrationId, registrations.id),
          eq(studentAttendance.examSessionId, examSessions.id)
        ))
        .where(and(
          eq(examSessions.id, parseInt(sessionId)),
          eq(examSessions.supervisorId, decoded.supervisorId)
        ))
        .orderBy(registrations.registrationNumber)

      return NextResponse.json({ students: sessionStudents })
    }

    // Calculate date filter
    const daysAgo = parseInt(period)
    const dateFilter = new Date()
    dateFilter.setDate(dateFilter.getDate() - daysAgo)

    // Get attendance reports for sessions supervised by this supervisor
    const reportsQuery = await db
      .select({
        sessionId: examSessions.id,
        sessionName: examSessions.sessionName,
        sessionDate: examSessions.sessionDate,
        subjectName: examSessions.subjectName,
        subjectCode: examSessions.subjectCode,
        startTime: examSessions.startTime,
        endTime: examSessions.endTime,
        totalStudents: sql<number>`COUNT(DISTINCT ${registrations.id})`,
        presentCount: sql<number>`COUNT(CASE WHEN ${studentAttendance.attendanceStatus} = 'present' THEN 1 END)`,
        absentCount: sql<number>`COUNT(CASE WHEN ${studentAttendance.attendanceStatus} = 'absent' THEN 1 END)`,
        lateCount: sql<number>`COUNT(CASE WHEN ${studentAttendance.attendanceStatus} = 'late' THEN 1 END)`,
        leftEarlyCount: sql<number>`COUNT(CASE WHEN ${studentAttendance.attendanceStatus} = 'left_early' THEN 1 END)`,
        notMarkedCount: sql<number>`COUNT(CASE WHEN ${studentAttendance.attendanceStatus} IS NULL THEN 1 END)`,
      })
      .from(examSessions)
      .leftJoin(registrations, and(
        eq(registrations.centerId, examSessions.centerId),
        eq(registrations.isPaid, true)
      ))
      .leftJoin(studentAttendance, and(
        eq(studentAttendance.registrationId, registrations.id),
        eq(studentAttendance.examSessionId, examSessions.id)
      ))
      .where(and(
        eq(examSessions.supervisorId, decoded.supervisorId),
        gte(examSessions.sessionDate, dateFilter.toISOString().split('T')[0])
      ))
      .groupBy(
        examSessions.id,
        examSessions.sessionName,
        examSessions.sessionDate,
        examSessions.subjectName,
        examSessions.subjectCode,
        examSessions.startTime,
        examSessions.endTime
      )
      .orderBy(desc(examSessions.sessionDate), desc(examSessions.startTime))

    // Calculate attendance percentages and format response
    const reports = reportsQuery.map(report => {
      const attendancePercentage = report.totalStudents > 0 
        ? (report.presentCount / report.totalStudents) * 100 
        : 0

      return {
        ...report,
        attendancePercentage
      }
    })

    // Calculate overall summary
    const totalSessions = reports.length
    const totalStudents = reports.reduce((sum, report) => sum + report.totalStudents, 0)
    const totalPresent = reports.reduce((sum, report) => sum + report.presentCount, 0)
    const overallAttendancePercentage = totalStudents > 0 
      ? (totalPresent / totalStudents) * 100 
      : 0

    return NextResponse.json({
      reports,
      summary: {
        totalSessions,
        totalStudents,
        overallAttendancePercentage
      }
    })

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
