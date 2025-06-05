import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { centers, chapters } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/admin/centers - Starting request")
    
    const session = await getSession()
    console.log("Session:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Unauthorized access attempt - not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const db = getDbConnection()
    
    // Get all centers with chapter information and registration counts
    const centersData = await db
      .select({
        id: centers.id,
        name: centers.name,
        chapterId: centers.chapterId,
        chapterName: chapters.name,
        createdAt: centers.createdAt,
        registrations: sql<number>`(
          SELECT COUNT(*) 
          FROM registrations 
          WHERE center_id = ${centers.id}
        )`.as('registrations')
      })
      .from(centers)
      .leftJoin(chapters, eq(centers.chapterId, chapters.id))
      .orderBy(centers.name)

    console.log(`Found ${centersData.length} centers`)
    
    return NextResponse.json(centersData)
  } catch (error) {
    console.error("Error fetching centers:", error)
    return NextResponse.json(
      { error: "Failed to fetch centers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/admin/centers - Starting request")
    
    const session = await getSession()
    console.log("Session:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Unauthorized access attempt - not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const body = await request.json()
    const { name, chapterId } = body

    if (!name || !chapterId) {
      return NextResponse.json(
        { error: "Name and chapter ID are required" },
        { status: 400 }
      )
    }

    const db = getDbConnection()
    
    // Check if chapter exists
    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1)

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    // Create the center
    const [newCenter] = await db
      .insert(centers)
      .values({
        name,
        chapterId: parseInt(chapterId),
        createdAt: new Date()
      })
      .returning()

    console.log("Created center:", newCenter)
    
    return NextResponse.json(newCenter, { status: 201 })
  } catch (error) {
    console.error("Error creating center:", error)
    return NextResponse.json(
      { error: "Failed to create center" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("PUT /api/admin/centers - Starting request")
    
    const session = await getSession()
    console.log("Session:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Unauthorized access attempt - not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const body = await request.json()
    const { id, name, chapterId } = body

    if (!id || !name || !chapterId) {
      return NextResponse.json(
        { error: "ID, name and chapter ID are required" },
        { status: 400 }
      )
    }

    const db = getDbConnection()
    
    // Check if chapter exists
    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1)

    if (chapter.length === 0) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    // Update the center
    const [updatedCenter] = await db
      .update(centers)
      .set({
        name,
        chapterId: parseInt(chapterId)
      })
      .where(eq(centers.id, parseInt(id)))
      .returning()

    if (!updatedCenter) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      )
    }

    console.log("Updated center:", updatedCenter)
    
    return NextResponse.json(updatedCenter)
  } catch (error) {
    console.error("Error updating center:", error)
    return NextResponse.json(
      { error: "Failed to update center" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("DELETE /api/admin/centers - Starting request")
    
    const session = await getSession()
    console.log("Session:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Unauthorized access attempt - not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Center ID is required" },
        { status: 400 }
      )
    }

    const db = getDbConnection()
    
    // Check if center has any registrations
    const registrationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(sql`registrations`)
      .where(sql`center_id = ${id}`)

    if (registrationsCount[0]?.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete center with existing registrations" },
        { status: 400 }
      )
    }

    // Delete the center
    const [deletedCenter] = await db
      .delete(centers)
      .where(eq(centers.id, parseInt(id)))
      .returning()

    if (!deletedCenter) {
      return NextResponse.json(
        { error: "Center not found" },
        { status: 404 }
      )
    }

    console.log("Deleted center:", deletedCenter)
    
    return NextResponse.json({ message: "Center deleted successfully" })
  } catch (error) {
    console.error("Error deleting center:", error)
    return NextResponse.json(
      { error: "Failed to delete center" },
      { status: 500 }
    )
  }
}
