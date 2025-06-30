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
    const { registrationIds } = await request.json()

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ error: "Invalid registration IDs" }, { status: 400 })
    }

    const db = getDbConnection()

    // Delete registrations
    const result = await db
      .delete(registrations)
      .where(inArray(registrations.id, registrationIds))
      .returning({ id: registrations.id })

    return NextResponse.json({
      message: `Successfully deleted ${result.length} registrations`,
      deletedCount: result.length
    })

  } catch (error) {
    console.error("Error in bulk delete:", error)
    return NextResponse.json(
      { error: "Failed to delete registrations" },
      { status: 500 }
    )
  }
}
