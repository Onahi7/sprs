import { NextResponse } from "next/server"
import { importCSV } from "@/lib/csv"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const entityType = formData.get("entityType") as "chapter" | "school" | "center"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!entityType || !["chapter", "school", "center"].includes(entityType)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 })
    }

    const result = await importCSV(file, entityType)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error importing CSV:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
