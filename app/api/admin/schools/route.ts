import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { schools, chapters } from "@/db/schema"
import { eq, ilike, and, or, count } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const chapterId = searchParams.get("chapterId")

    const db = getDbConnection()

    // Build where conditions
    const whereConditions = []

    if (chapterId && chapterId !== "all") {
      whereConditions.push(eq(schools.chapterId, Number.parseInt(chapterId)))
    }

    if (search) {
      whereConditions.push(ilike(schools.name, `%${search}%`))
    }

    // Get schools with chapter information
    const schoolsData = await db
      .select({
        id: schools.id,
        name: schools.name,
        chapterId: schools.chapterId,
        chapterName: chapters.name,
        createdAt: schools.createdAt,
      })
      .from(schools)
      .leftJoin(chapters, eq(schools.chapterId, chapters.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(schools.name)

    return NextResponse.json(schoolsData)
  } catch (error) {
    console.error("Error fetching schools:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { name, chapterId } = await request.json()

    if (!name || !chapterId) {
      return NextResponse.json({ error: "Name and chapter ID are required" }, { status: 400 })
    }

    const db = getDbConnection()
    const newSchool = await db
      .insert(schools)
      .values({
        name,
        chapterId,
      })
      .returning()

    return NextResponse.json(newSchool[0], { status: 201 })
  } catch (error) {
    console.error("Error creating school:", error)
    return NextResponse.json({ error: "Failed to create school" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const { name, chapterId } = await request.json()

    if (!name || !chapterId) {
      return NextResponse.json({ error: "Name and chapter ID are required" }, { status: 400 })
    }

    const db = getDbConnection()
    const updatedSchool = await db
      .update(schools)
      .set({
        name,
        chapterId,
      })
      .where(eq(schools.id, Number.parseInt(id)))
      .returning()

    if (updatedSchool.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json(updatedSchool[0])
  } catch (error) {
    console.error("Error updating school:", error)
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 })
    }

    const db = getDbConnection()
    const deletedSchool = await db
      .delete(schools)
      .where(eq(schools.id, Number.parseInt(id)))
      .returning()

    if (deletedSchool.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "School deleted successfully" })
  } catch (error) {
    console.error("Error deleting school:", error)
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 })
  }
}
