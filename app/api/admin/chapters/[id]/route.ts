import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapters } from "@/db/schema"
import { eq } from "drizzle-orm"

interface ChapterParams {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: ChapterParams) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }
    
    const db = getDbConnection()
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id)
    })
    
    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }
    
    return NextResponse.json(chapter)
    
  } catch (error) {
    console.error("Error fetching chapter:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: ChapterParams) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }
    
    const body = await request.json()
      // Validate required fields
    if (!body.name || !body.amount) {
      return NextResponse.json(
        { error: "Name and amount are required" },
        { status: 400 }
      )
    }
    
    const db = getDbConnection()
    
    // Check if chapter exists
    const existingChapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id)
    })
    
    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }
      // Update chapter
    await db.update(chapters)
      .set({
        name: body.name,
        amount: body.amount,
        splitCode: body.splitCode || null
      })
      .where(eq(chapters.id, id))
    
    return NextResponse.json({ success: true, message: "Chapter updated successfully" })
    
  } catch (error) {
    console.error("Error updating chapter:", error)
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: ChapterParams) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
    }
    
    const db = getDbConnection()
    
    // Check if chapter exists
    const existingChapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, id)
    })
    
    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }
    
    // TODO: Check for related data before deleting
    // This would prevent deletion of chapters with schools, centers, registrations, etc.
    
    // Delete chapter
    await db.delete(chapters).where(eq(chapters.id, id))
    
    return NextResponse.json({ success: true, message: "Chapter deleted successfully" })
    
  } catch (error) {
    console.error("Error deleting chapter:", error)
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    )
  }
}
