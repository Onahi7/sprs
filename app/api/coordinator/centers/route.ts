import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { centers, chapters, registrations } from "@/db/schema"
import { eq, ilike, and, or, count } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const chapterId = session.chapterId
    if (!chapterId) {
    return NextResponse.json({ error: "No chapter assigned to coordinator" }, { status: 400 })
  }

  try {
    const db = getDbConnection()
    
    // Build the WHERE condition
    const whereCondition = search 
      ? and(
          eq(centers.chapterId, chapterId),
          ilike(centers.name, `%${search}%`)
        )
      : eq(centers.chapterId, chapterId)
    
    // Get centers for this coordinator's chapter
    const centersData = await db
      .select({
        id: centers.id,
        name: centers.name,
        chapterId: centers.chapterId,
        chapterName: chapters.name,
        createdAt: centers.createdAt,
      })
      .from(centers)
      .innerJoin(chapters, eq(centers.chapterId, chapters.id))
      .where(whereCondition)
      .orderBy(centers.name)
    
    // Get registration counts for each center
    const centersWithCounts = await Promise.all(
      centersData.map(async (center) => {
        const registrationCountResult = await db
          .select({ count: count() })
          .from(registrations)
          .where(eq(registrations.centerId, center.id))
          
        return {
          ...center,
          registrationCount: registrationCountResult[0].count,
        }
      })
    )
    
    return NextResponse.json({ centers: centersWithCounts })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch centers" }, { status: 500 })
  }
}
