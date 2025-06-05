import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { chapterCoordinators } from "@/db/schema"
import { generateUniqueCode } from "@/lib/utils"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const db = getDbConnection()
    const coordinators = await db.query.chapterCoordinators.findMany({
      with: {
        chapter: true,
      },
      orderBy: (chapterCoordinators, { asc }) => [asc(chapterCoordinators.name)],
    })

    // Transform the data to include chapterName at the top level
    const transformedCoordinators = coordinators.map(coordinator => ({
      id: coordinator.id,
      name: coordinator.name,
      email: coordinator.email,
      uniqueCode: coordinator.uniqueCode,
      chapterId: coordinator.chapterId,
      chapterName: coordinator.chapter?.name || 'Unknown Chapter',
      createdAt: coordinator.createdAt,
    }))

    return NextResponse.json(transformedCoordinators)
  } catch (error) {
    console.error("Error fetching coordinators:", error)
    return NextResponse.json({ error: "Failed to fetch coordinators" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, chapterId } = await request.json()

    if (!name || !email || !chapterId) {
      return NextResponse.json({ error: "Name, email, and chapter ID are required" }, { status: 400 })
    }

    // Generate a unique code for the coordinator
    const uniqueCode = await generateUniqueCode()
    const db = getDbConnection()

    const newCoordinator = await db
      .insert(chapterCoordinators)
      .values({
        name,
        email,
        chapterId,
        uniqueCode,
      })
      .returning()

    return NextResponse.json(newCoordinator[0], { status: 201 })
  } catch (error) {
    console.error("Error creating coordinator:", error)
    return NextResponse.json({ error: "Failed to create coordinator" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Coordinator ID is required" }, { status: 400 })
    }

    const { name, email, chapterId, uniqueCode } = await request.json()

    if (!name || !email || !chapterId || !uniqueCode) {
      return NextResponse.json({ error: "Name, email, chapter ID, and unique code are required" }, { status: 400 })
    }

    const db = getDbConnection()
    const updatedCoordinator = await db
      .update(chapterCoordinators)
      .set({
        name,
        email,
        chapterId,
        uniqueCode,
      })
      .where(eq(chapterCoordinators.id, Number.parseInt(id)))
      .returning()

    if (updatedCoordinator.length === 0) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    return NextResponse.json(updatedCoordinator[0])
  } catch (error) {
    console.error("Error updating coordinator:", error)
    return NextResponse.json({ error: "Failed to update coordinator" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Coordinator ID is required" }, { status: 400 })
    }

    const db = getDbConnection()
    const deletedCoordinator = await db
      .delete(chapterCoordinators)
      .where(eq(chapterCoordinators.id, Number.parseInt(id)))
      .returning()

    if (deletedCoordinator.length === 0) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Coordinator deleted successfully" })
  } catch (error) {
    console.error("Error deleting coordinator:", error)
    return NextResponse.json({ error: "Failed to delete coordinator" }, { status: 500 })
  }
}
