import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ user: null })
    }
    
    let userData = null
    
    if (session.role === "coordinator" && session.id) {
      const db = getDbConnection()
      
      // Get coordinator details
      const coordinator = await db.query.chapterCoordinators.findFirst({
        where: eq(chapterCoordinators.id, session.id),
        with: {
          chapter: true,
        },
      })
      
      if (coordinator && coordinator.chapter) {
        userData = {
          id: coordinator.id,
          name: coordinator.name,
          email: coordinator.email,
          role: "coordinator",
          chapterId: coordinator.chapterId,
          chapterName: coordinator.chapter.name,
        }
      }
    }
    
    if (session.role === "admin") {
      userData = {
        username: session.username,
        role: "admin"
      }
    }
    
    return NextResponse.json({ user: userData, session })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
