import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { 
  studentAttendance, 
  registrations, 
  examSessions, 
  supervisors,
  schools
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  supervisorId: number
  centerId: number
}

// GET - Get students for attendance marking
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

    const { searchParams } = new URL(request.url)
    const examSessionId = searchParams.get("sessionId")

    if (!examSessionId) {
      return NextResponse.json({ error: "Exam session ID is required" }, { status: 400 })
    }

    // Get exam session details (join with subjects for name/code)
    const examSessionData = await db
      .select({
        id: examSessions.id,
        sessionName: examSessions.sessionName,
        sessionDate: examSessions.sessionDate,
        startTime: examSessions.startTime,
        endTime: examSessions.endTime,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(examSessions)
      .leftJoin(subjects, eq(examSessions.subjectId, subjects.id))
      .where(eq(examSessions.id, parseInt(examSessionId)))
      .limit(1)

    if (examSessionData.length === 0) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 })
    }

    // Get students registered to this center (paid only)
    const studentsWithAttendance = await db
      .select({
        registrationId: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: schools.name,
        passportUrl: registrations.passportUrl,
        attendanceId: studentAttendance.id,
        attendanceStatus: studentAttendance.attendanceStatus,
        arrivalTime: studentAttendance.arrivalTime,
        departureTime: studentAttendance.departureTime,
        notes: studentAttendance.notes,
        markedAt: studentAttendance.markedAt,
      })
      .from(registrations)
      .leftJoin(schools, eq(schools.id, registrations.schoolId))
      .leftJoin(studentAttendance, and(
        eq(studentAttendance.registrationId, registrations.id),
        eq(studentAttendance.examSessionId, parseInt(examSessionId))
      ))
      .where(and(
        eq(registrations.centerId, decoded.centerId),
        eq(registrations.paymentStatus, "completed")
      ))
      .orderBy(registrations.firstName, registrations.lastName)

    // Get supervisor info
    const supervisor = await db
      .select({
        name: supervisors.name,
        centerId: supervisors.centerId
      })
      .from(supervisors)
      .where(eq(supervisors.id, decoded.supervisorId))
      .limit(1)

    return NextResponse.json({
      examSession: examSessionData[0],
      students: studentsWithAttendance,
      supervisor: supervisor[0]
    })

  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 })
  }
}

// POST - Mark attendance for a student
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { registrationId, examSessionId, attendanceStatus, notes } = body

    if (!registrationId || !examSessionId || !attendanceStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate attendance status
    const validStatuses = ['present', 'absent', 'late', 'left_early']
    if (!validStatuses.includes(attendanceStatus)) {
      return NextResponse.json({ error: "Invalid attendance status" }, { status: 400 })
    }

    // Verify the student belongs to this supervisor's center
    const student = await db
      .select()
      .from(registrations)
      .where(and(
        eq(registrations.id, registrationId),
        eq(registrations.centerId, decoded.centerId)
      ))
      .limit(1)

    if (student.length === 0) {
      return NextResponse.json({ error: "Student not found in your center" }, { status: 404 })
    }

    // Check if attendance record already exists
    const existingAttendance = await db
      .select()
      .from(studentAttendance)
      .where(and(
        eq(studentAttendance.registrationId, registrationId),
        eq(studentAttendance.examSessionId, examSessionId)
      ))
      .limit(1)

    const attendanceData = {
      registrationId,
      examSessionId,
      supervisorId: decoded.supervisorId,
      centerId: decoded.centerId,
      attendanceStatus,
      notes: notes || null,
      arrivalTime: attendanceStatus === 'present' || attendanceStatus === 'late' 
        ? new Date() 
        : null,
      updatedAt: new Date()
    }

    let result
    if (existingAttendance.length > 0) {
      // Update existing record
      result = await db
        .update(studentAttendance)
        .set(attendanceData)
        .where(eq(studentAttendance.id, existingAttendance[0].id))
        .returning()
    } else {
      // Create new record
      result = await db
        .insert(studentAttendance)
        .values({
          ...attendanceData,
          markedAt: new Date()
        })
        .returning()
    }

    return NextResponse.json({
      success: true,
      attendance: result[0],
      message: `Attendance marked as ${attendanceStatus}`
    })

  } catch (error) {
    console.error("Error marking attendance:", error)
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 })
  }
}
