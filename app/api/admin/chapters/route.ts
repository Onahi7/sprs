import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapters } from "@/db/schema"
import { eq, count } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
      // Get chapters with counts of related entities
    const chaptersWithStats = await db
      .select({
        id: chapters.id,
        name: chapters.name,
        amount: chapters.amount,
        splitCode: chapters.splitCode,
        createdAt: chapters.createdAt
      })
      .from(chapters)
      .orderBy(chapters.name)
    
    // This is a simple implementation. In a production app, you would 
    // add JOIN queries to get counts of related entities per chapter
    
    return NextResponse.json(chaptersWithStats)
    
  } catch (error) {
    console.error("Error fetching chapters:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    
    // Check if a chapter with the same name already exists
    const existingChapter = await db.query.chapters.findFirst({
      where: eq(chapters.name, body.name)
    })
    
    if (existingChapter) {
      return NextResponse.json(
        { error: "A chapter with this name already exists" },
        { status: 400 }
      )
    }
      // Create new chapter
    const [newChapter] = await db.insert(chapters)
      .values({
        name: body.name,
        amount: body.amount,
        splitCode: body.splitCode || null
      })
      .returning()
    
    return NextResponse.json({
      success: true,
      message: "Chapter created successfully",
      chapter: newChapter
    })
    
  } catch (error) {
    console.error("Error creating chapter:", error)
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    )
  }
}
