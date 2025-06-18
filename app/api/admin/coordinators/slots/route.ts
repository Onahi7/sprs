import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapterCoordinators, coordinatorSlots, chapters } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDbConnection()
    
    // Fetch all coordinators with their slot information and chapter details
    const coordinatorsWithSlots = await db
      .select({
        id: chapterCoordinators.id,
        name: chapterCoordinators.name,
        email: chapterCoordinators.email,
        chapterId: chapterCoordinators.chapterId,
        chapterName: chapters.name,
        availableSlots: coordinatorSlots.availableSlots,
        usedSlots: coordinatorSlots.usedSlots,
        totalPurchasedSlots: coordinatorSlots.totalPurchasedSlots,
        lastPurchaseDate: coordinatorSlots.lastPurchaseDate,
        lastUsageDate: coordinatorSlots.lastUsageDate,
        createdAt: chapterCoordinators.createdAt,
        isActive: chapterCoordinators.isActive
      })
      .from(chapterCoordinators)
      .leftJoin(chapters, eq(chapterCoordinators.chapterId, chapters.id))
      .leftJoin(coordinatorSlots, eq(chapterCoordinators.id, coordinatorSlots.coordinatorId))
      .where(eq(chapterCoordinators.isActive, true))
      .orderBy(desc(chapterCoordinators.createdAt))

    // Format the data for the frontend
    const formattedCoordinators = coordinatorsWithSlots.map(coord => ({
      id: coord.id,
      name: coord.name,
      email: coord.email,
      chapterId: coord.chapterId,
      chapterName: coord.chapterName || 'Unknown Chapter',
      availableSlots: coord.availableSlots || 0,
      usedSlots: coord.usedSlots || 0,
      totalPurchasedSlots: coord.totalPurchasedSlots || 0,
      lastPurchaseDate: coord.lastPurchaseDate?.toISOString(),
      lastUsageDate: coord.lastUsageDate?.toISOString(),
      createdAt: coord.createdAt?.toISOString(),
      isActive: coord.isActive
    }))

    return NextResponse.json(formattedCoordinators)

  } catch (error) {
    console.error("Error fetching coordinators with slots:", error)
    return NextResponse.json(
      { error: "Failed to fetch coordinator data" },
      { status: 500 }
    )
  }
}
