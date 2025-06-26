import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { 
  examSessions, 
  studentAttendance, 
  registrations, 
  supervisors,
  schools
} from '@/db/schema'
import { eq, and, gte, desc } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface JWTPayload {
  supervisorId: number
  centerId: number
}

function formatCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
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
    const sessionId = searchParams.get('sessionId')
    const period = searchParams.get('period') || '7'

    if (sessionId) {
      // Export specific session (join with subjects for name/code)
      const sessionDetails = await db
        .select({
          sessionId: examSessions.id,
          sessionName: examSessions.sessionName,
          sessionDate: examSessions.sessionDate,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          startTime: examSessions.startTime,
          endTime: examSessions.endTime,
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
        .leftJoin(subjects, eq(examSessions.subjectId, subjects.id))
        .innerJoin(registrations, eq(registrations.centerId, decoded.centerId))
        .leftJoin(schools, eq(schools.id, registrations.schoolId))
        .leftJoin(studentAttendance, and(
          eq(studentAttendance.registrationId, registrations.id),
          eq(studentAttendance.examSessionId, examSessions.id)
        ))
        .where(and(
          eq(examSessions.id, parseInt(sessionId)),
          eq(registrations.paymentStatus, "completed"),
          eq(examSessions.isActive, true)
        ))
        .orderBy(registrations.registrationNumber)

      if (sessionDetails.length === 0) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }

      // Format data for CSV
      const csvData = sessionDetails.map(row => ({
        'Session Name': row.sessionName,
        'Subject': `${row.subjectName} (${row.subjectCode})`,
        'Date': row.sessionDate,
        'Time': `${row.startTime} - ${row.endTime}`,
        'Registration Number': row.registrationNumber,
        'Student Name': `${row.firstName} ${row.middleName || ''} ${row.lastName}`.trim(),
        'School': row.schoolName || 'N/A',
        'Attendance Status': row.attendanceStatus || 'Not Marked',
        'Arrival Time': row.arrivalTime || '',
        'Departure Time': row.departureTime || '',
        'Notes': row.notes || '',
        'Marked At': row.markedAt ? new Date(row.markedAt).toLocaleString() : ''
      }))

      const csvContent = formatCSV(csvData)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-session-${sessionId}.csv"`
        }
      })

    } else {
      // Export all sessions for the period (join with subjects for name/code)
      const daysAgo = parseInt(period)
      const dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - daysAgo)

      const allSessionsData = await db
        .select({
          sessionName: examSessions.sessionName,
          sessionDate: examSessions.sessionDate,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          startTime: examSessions.startTime,
          endTime: examSessions.endTime,
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
        .leftJoin(subjects, eq(examSessions.subjectId, subjects.id))
        .innerJoin(registrations, eq(registrations.centerId, decoded.centerId))
        .leftJoin(schools, eq(schools.id, registrations.schoolId))
        .leftJoin(studentAttendance, and(
          eq(studentAttendance.registrationId, registrations.id),
          eq(studentAttendance.examSessionId, examSessions.id)
        ))
        .where(and(
          eq(examSessions.supervisorId, decoded.supervisorId),
          eq(registrations.paymentStatus, "completed"),
          eq(examSessions.isActive, true),
          gte(examSessions.sessionDate, dateFilter)
        ))
        .orderBy(
          desc(examSessions.sessionDate), 
          desc(examSessions.startTime),
          registrations.registrationNumber
        )

      // Format data for CSV
      const csvData = allSessionsData.map(row => ({
        'Session Name': row.sessionName,
        'Subject': `${row.subjectName} (${row.subjectCode})`,
        'Date': row.sessionDate,
        'Time': `${row.startTime} - ${row.endTime}`,
        'Registration Number': row.registrationNumber,
        'Student Name': `${row.firstName} ${row.middleName || ''} ${row.lastName}`.trim(),
        'School': row.schoolName || 'N/A',
        'Attendance Status': row.attendanceStatus || 'Not Marked',
        'Arrival Time': row.arrivalTime || '',
        'Departure Time': row.departureTime || '',
        'Notes': row.notes || '',
        'Marked At': row.markedAt ? new Date(row.markedAt).toLocaleString() : ''
      }))

      const csvContent = formatCSV(csvData)
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-report-${period}days.csv"`
        }
      })
    }

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
