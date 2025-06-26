import { NextRequest } from "next/server"
import { getDbConnection } from "@/db"
import { supervisors, supervisorSessions } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"

export interface SupervisorSession {
  id: number
  name: string
  phoneNumber: string
  schoolName?: string
  centerId: number | null
  chapterId: number | null
}

export async function getSupervisorSession(request: NextRequest): Promise<SupervisorSession | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      return null
    }

    const db = getDbConnection()

    // Find valid session
    const session = await db.select({
      supervisorId: supervisorSessions.supervisorId,
      expiresAt: supervisorSessions.expiresAt,
    })
      .from(supervisorSessions)
      .where(and(
        eq(supervisorSessions.sessionToken, token),
        gt(supervisorSessions.expiresAt, new Date())
      ))
      .limit(1)
      .execute()

    if (session.length === 0 || session[0].supervisorId == null) {
      return null
    }

    // Get supervisor details
    const supervisor = await db.select()
      .from(supervisors)
      .where(and(
        eq(supervisors.id, session[0].supervisorId as number),
        eq(supervisors.isActive, true)
      ))
      .limit(1)
      .execute()

    if (supervisor.length === 0) {
      return null
    }

    const supervisorData = supervisor[0]

    return {
      id: supervisorData.id,
      name: supervisorData.name,
      phoneNumber: supervisorData.phoneNumber,
      schoolName: supervisorData.schoolName || undefined,
      centerId: supervisorData.centerId,
      chapterId: supervisorData.chapterId
    }

  } catch (error) {
    console.error("Error getting supervisor session:", error)
    return null
  }
}
