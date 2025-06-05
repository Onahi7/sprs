import { NextResponse } from "next/server"
import { exportRegistrationsToCSV } from "@/lib/csv"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const status = searchParams.get("status")

    // Prepare filters
    const filters: any = {}

    if (chapterId && chapterId !== "all") {
      filters.chapterId = Number.parseInt(chapterId)
    }

    if (status && status !== "all") {
      filters.status = status as "pending" | "completed"
    }

    // Export registrations with filters
    const result = await exportRegistrationsToCSV(filters)

    if (!result.success) {
      throw new Error(result.error)
    }

    // Set headers for CSV download
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", `attachment; filename="napps-all-registrations-${new Date().toISOString().split("T")[0]}.csv"`)

    return new NextResponse(result.csv, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error exporting registrations:", error)
    return NextResponse.json({ error: "Failed to export registrations" }, { status: 500 })
  }
}
