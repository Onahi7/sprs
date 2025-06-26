import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { studentAttendance, registrations, examSessions, subjects, centers } from "@/db/schema"
import { eq, and, count, gte, lte } from "drizzle-orm"
import { getSupervisorSession } from "@/lib/supervisor-auth"

// GET - Get supervisor dashboard data
export async function GET(request: NextRequest) {
  const session = await getSupervisorSession(request)
  
  if (!session) {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const db = getDbConnection()
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    // Get center info
    const centerInfo = await db.select()
      .from(centers)
      .where(eq(centers.id, session.centerId))
      .limit(1)
      .execute()

    // Get today's exam sessions
    const todaySessions = await db.select({
      id: examSessions.id,
      sessionName: examSessions.sessionName,
      startTime: examSessions.startTime,
      endTime: examSessions.endTime,
      subjectName: subjects.name,
      subjectCode: subjects.code,
    })
      .from(examSessions)
      .leftJoin(subjects, eq(examSessions.subjectId, subjects.id))
      .where(and(
        eq(examSessions.isActive, true),
        gte(examSessions.sessionDate, startOfDay),
        lte(examSessions.sessionDate, endOfDay)
      ))
      .orderBy(examSessions.startTime)
      .execute()

    // Get total students in center
    const totalStudents = await db.select({ count: count() })
      .from(registrations)
      .where(and(
        eq(registrations.centerId, session.centerId),
        eq(registrations.paymentStatus, "completed")
      ))
      .execute()

    // Get attendance statistics for today
    const attendanceStats = await db.select({
      attendanceStatus: studentAttendance.attendanceStatus,
      count: count()
    })
      .from(studentAttendance)
      .innerJoin(examSessions, eq(studentAttendance.examSessionId, examSessions.id))
      .where(and(
        eq(studentAttendance.centerId, session.centerId),
        gte(examSessions.sessionDate, startOfDay),
        lte(examSessions.sessionDate, endOfDay)
      ))
      .groupBy(studentAttendance.attendanceStatus)
      .execute()

    // Get recent attendance activities
    const recentActivities = await db.select({
      id: studentAttendance.id,
      studentName: registrations.firstName,
      studentLastName: registrations.lastName,
      registrationNumber: registrations.registrationNumber,
      attendanceStatus: studentAttendance.attendanceStatus,
      markedAt: studentAttendance.markedAt,
      sessionName: examSessions.sessionName,
      subjectName: subjects.name,
    })
      .from(studentAttendance)
      .innerJoin(registrations, eq(studentAttendance.registrationId, registrations.id))
      .innerJoin(examSessions, eq(studentAttendance.examSessionId, examSessions.id))
      .leftJoin(subjects, eq(examSessions.subjectId, subjects.id))
      .where(eq(studentAttendance.supervisorId, session.id))
      .orderBy(studentAttendance.markedAt)
      .limit(10)
      .execute()

    // Process attendance stats
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      left_early: 0
    }

    attendanceStats.forEach(stat => {
      if (stat.attendanceStatus && stat.attendanceStatus in stats) {
        stats[stat.attendanceStatus as keyof typeof stats] = stat.count
      }
    })

    return NextResponse.json({
      supervisor: {
        name: session.name,
        phoneNumber: session.phoneNumber,
        schoolName: session.schoolName,
        centerName: centerInfo[0]?.name || 'Unknown Center'
      },
      todaySessions,
      statistics: {
        totalStudents: totalStudents[0]?.count || 0,
        attendanceStats: stats,
        totalMarked: Object.values(stats).reduce((a, b) => a + b, 0)
      },
      recentActivities: recentActivities.map(activity => ({
        ...activity,
        studentFullName: `${activity.studentName} ${activity.studentLastName}`
      }))
    })

  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch dashboard data"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
