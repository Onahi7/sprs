import { NextResponse } from "next/server"
import { db } from "@/db"
import { chapters, schools, centers, chapterCoordinators } from "@/db/schema"
import { inArray } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const { entityType, ids } = await request.json()

    if (!entityType || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Entity type and array of IDs are required" }, { status: 400 })
    }

    let result
    switch (entityType) {
      case "chapter":
        result = await db.delete(chapters).where(inArray(chapters.id, ids)).returning()
        break
      case "school":
        result = await db.delete(schools).where(inArray(schools.id, ids)).returning()
        break
      case "center":
        result = await db.delete(centers).where(inArray(centers.id, ids)).returning()
        break
      case "coordinator":
        result = await db.delete(chapterCoordinators).where(inArray(chapterCoordinators.id, ids)).returning()
        break
      default:
        return NextResponse.json(
          { error: "Invalid entity type. Must be one of: chapter, school, center, coordinator" },
          { status: 400 },
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.length} ${entityType}(s)`,
      deletedCount: result.length,
    })
  } catch (error) {
    console.error(`Error performing bulk delete for ${entityType}:`, error)
    return NextResponse.json({ error: "Failed to perform bulk delete operation" }, { status: 500 })
  }
}
