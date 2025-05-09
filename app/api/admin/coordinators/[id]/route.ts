import { NextResponse } from "next/server"
import { db } from "@/db"
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coordinator ID" }, { status: 400 })
    }

    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.id, id),
      with: {
        chapter: true,
      },
    })

    if (!coordinator) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    return NextResponse.json(coordinator)
  } catch (error) {
    console.error("Error fetching coordinator:", error)
    return NextResponse.json({ error: "Failed to fetch coordinator" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coordinator ID" }, { status: 400 })
    }

    const { name, email, chapterId } = await request.json()

    const updatedCoordinator = await db
      .update(chapterCoordinators)
      .set({
        name,
        email,
        chapterId,
      })
      .where(eq(chapterCoordinators.id, id))
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid coordinator ID" }, { status: 400 })
    }

    const deletedCoordinator = await db.delete(chapterCoordinators).where(eq(chapterCoordinators.id, id)).returning()

    if (deletedCoordinator.length === 0) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting coordinator:", error)
    return NextResponse.json({ error: "Failed to delete coordinator" }, { status: 500 })
  }
}
