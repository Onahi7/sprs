import { NextResponse } from "next/server"
import { exportRegistrationsToCSV } from "@/lib/csv"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const chapterId = session.chapterId
    
    if (!chapterId) {
      return NextResponse.json({ error: "No chapter assigned to coordinator" }, { status: 400 })
    }
    
    const db = getDbConnection()
    
    // Get chapter name for file naming
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
    })

    // Export registrations for this chapter
    const result = await exportRegistrationsToCSV({
      chapterId: chapterId,
    })

    if (!result.success) {
      throw new Error(result.error)
    }

    // Set headers for CSV download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set(
      "Content-Disposition", 
      `attachment; filename="napps-registrations-${chapter?.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() || chapterId}-${new Date().toISOString().split("T")[0]}.csv"`
    )

    return new NextResponse(result.csv, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error exporting registrations:", error)
    return NextResponse.json({ error: "Failed to export registrations" }, { status: 500 })
  }
}
