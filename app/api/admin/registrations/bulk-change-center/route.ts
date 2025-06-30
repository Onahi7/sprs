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
    const { registrationIds, centerId } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    if (!centerId) {
      return NextResponse.json({ error: "Center ID is required" }, { status: 400 })
    }

    const db = getDbConnection()

    // Update registrations with new center
    const result = await db
      .update(registrations)
      .set({ centerId: parseInt(centerId) })
      .where(inArray(registrations.id, registrationIds))
      .returning({ id: registrations.id })

    return NextResponse.json({
      message: `Successfully updated ${result.length} registrations`,
      updatedCount: result.length
    })

  } catch (error) {
    console.error("Error in bulk center change:", error)
    return NextResponse.json(
      { error: "Failed to update centers" },
      { status: 500 }
    )
  }
}
