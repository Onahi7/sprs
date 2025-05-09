import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { chapters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    // Get the database connection
    const db = getDbConnection()
    
    // Ensure params is properly awaited
    const { id: paramId } = await Promise.resolve(params)
    const id = Number.parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }

    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id),
    })

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Error fetching chapter:", error)
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 })
  }
}

export async function PUT(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    // Get the database connection
    const db = getDbConnection()
    
    // Ensure params is properly awaited
    const { id: paramId } = await Promise.resolve(params)
    const id = Number.parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }

    const { name, splitCode, amount } = await request.json()

    const updatedChapter = await db
      .update(chapters)
      .set({
        name,
        splitCode: splitCode || null,
        amount: amount || "3000.00",
      })
      .where(eq(chapters.id, id))
      .returning()

    if (updatedChapter.length === 0) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json(updatedChapter[0])
  } catch (error) {
    console.error("Error updating chapter:", error)
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    // Get the database connection
    const db = getDbConnection()
    
    // Ensure params is properly awaited
    const { id: paramId } = await Promise.resolve(params)
    const id = Number.parseInt(paramId)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }

    const deletedChapter = await db.delete(chapters).where(eq(chapters.id, id)).returning()

    if (deletedChapter.length === 0) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chapter:", error)
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 })
  }
}
