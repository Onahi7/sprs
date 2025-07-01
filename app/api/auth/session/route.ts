import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ session: null })
    }
    
    let enhancedSession = { ...session }
    
    // If coordinator, get additional details
    if (session.role === "coordinator" && session.id) {
      const db = getDbConnection()
      
      const coordinator = await db.query.chapterCoordinators.findFirst({
        where: eq(chapterCoordinators.id, session.id),
        with: {
          chapter: true,
        },
      })
      
      if (coordinator && coordinator.chapter) {
        enhancedSession = {
          ...session,
          name: coordinator.name,
          email: coordinator.email,
          chapterName: coordinator.chapter.name,
        }
      }
    }
    
    return NextResponse.json({ 
      session: enhancedSession,
      user: enhancedSession // For backward compatibility
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
