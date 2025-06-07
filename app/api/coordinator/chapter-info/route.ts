import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { chapters, schools, centers, chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const db = getDbConnection()
    const coordinatorId = session.id!

    // Get coordinator details with chapter info
    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.id, coordinatorId),
      with: {
        chapter: true
      }
    })

    if (!coordinator || !coordinator.chapter) {
      return NextResponse.json({ error: "Coordinator chapter not found" }, { status: 404 })
    }

    // Get schools for this chapter
    const chapterSchools = await db.query.schools.findMany({
      where: eq(schools.chapterId, coordinator.chapterId!),
      orderBy: (schools, { asc }) => [asc(schools.name)]
    })

    // Get centers for this chapter
    const chapterCenters = await db.query.centers.findMany({
      where: eq(centers.chapterId, coordinator.chapterId!),
      orderBy: (centers, { asc }) => [asc(centers.name)]
    })

    return NextResponse.json({
      coordinator: {
        id: coordinator.id,
        name: coordinator.name,
        email: coordinator.email,
        chapterId: coordinator.chapterId
      },
      chapter: coordinator.chapter,
      schools: chapterSchools,
      centers: chapterCenters
    })
  } catch (error) {
    console.error("Error fetching coordinator info:", error)
    return NextResponse.json(
      { error: "Failed to fetch coordinator information" },
      { status: 500 }
    )
  }
}
