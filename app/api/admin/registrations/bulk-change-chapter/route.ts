import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { registrationIds, chapterId } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }

    const db = getDbConnection()

    // Update registrations with new chapter (and reset center since it might not be valid for new chapter)
    const result = await db
      .update(registrations)
      .set({ 
        chapterId: parseInt(chapterId),
        centerId: null // Reset center when changing chapter
      })
      .where(inArray(registrations.id, registrationIds))
      .returning({ id: registrations.id })

    return NextResponse.json({
      message: `Successfully updated ${result.length} registrations`,
      updatedCount: result.length
    })

  } catch (error) {
    console.error("Error in bulk chapter change:", error)
    return NextResponse.json(
      { error: "Failed to update chapters" },
      { status: 500 }
    )
  }
}
