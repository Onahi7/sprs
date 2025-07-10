import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { chapters, centers, registrations } from "@/db/schema"
import { eq, asc, count } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const db = getDbConnection()
    
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (chapterId) {
      // Get centers for specific chapter with student counts
      const centersWithCounts = await db
        .select({
          id: centers.id,
          name: centers.name,
          chapterId: centers.chapterId,
          studentCount: count(registrations.id)
        })
        .from(centers)
        .leftJoin(registrations, eq(centers.id, registrations.centerId))
        .where(eq(centers.chapterId, parseInt(chapterId)))
        .groupBy(centers.id, centers.name, centers.chapterId)
        .orderBy(asc(centers.name))

      return NextResponse.json({ centers: centersWithCounts })
    } else {
      // Get all chapters with their centers and student counts
      const chaptersWithData = await db
        .select({
          id: chapters.id,
          name: chapters.name,
          splitCode: chapters.splitCode,
          totalStudents: count(registrations.id)
        })
        .from(chapters)
        .leftJoin(registrations, eq(chapters.id, registrations.chapterId))
        .groupBy(chapters.id, chapters.name, chapters.splitCode)
        .orderBy(asc(chapters.name))

      return NextResponse.json({ chapters: chaptersWithData })
    }
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    )
  }
}
