import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { examSessions, subjects } from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { getSupervisorSession } from "@/lib/supervisor-auth"

// GET - Get exam sessions for today or specific date
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

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split('T')[0]

  try {
    const db = getDbConnection()
    
    // Get start and end of the specified date
    const startOfDay = new Date(`${date}T00:00:00.000Z`)
    const endOfDay = new Date(`${date}T23:59:59.999Z`)

    const sessions = await db.select({
      id: examSessions.id,
      sessionDate: examSessions.sessionDate,
      startTime: examSessions.startTime,
      endTime: examSessions.endTime,
      sessionName: examSessions.sessionName,
      isActive: examSessions.isActive,
      subjectId: examSessions.subjectId,
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

    return NextResponse.json({ 
      sessions,
      date,
      supervisor: {
        name: session.name,
        centerI: session.centerId
      }
    })

  } catch (error) {
    console.error("Error fetching exam sessions:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch exam sessions"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
