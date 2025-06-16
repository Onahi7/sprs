import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db"
import { chapterCoordinators, chapters } from "@/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getSession()
    

    if (!session || session.role !== "coordinator" || typeof session.id !== 'number') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get coordinator data with chapter information
    const db = getDbConnection();
    const coordinatorData = await db
      .select({
        id: chapterCoordinators.id,
        name: chapterCoordinators.name,
        email: chapterCoordinators.email,
        uniqueCode: chapterCoordinators.uniqueCode,
        chapterId: chapterCoordinators.chapterId,
        chapterName: chapters.name
      })
      .from(chapterCoordinators)
      .leftJoin(chapters, eq(chapterCoordinators.chapterId, chapters.id))
      .where(eq(chapterCoordinators.id, session.id!))
      .limit(1)

    if (coordinatorData.length === 0) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    return NextResponse.json({
      coordinator: coordinatorData[0]
    })

  } catch (error) {
    console.error("Error fetching coordinator profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch coordinator profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator" || typeof session.id !== 'number') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email } = await request.json()

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Check if email is already taken by another coordinator

    const db = getDbConnection();
    const existingCoordinator = await db
      .select({ id: chapterCoordinators.id })
      .from(chapterCoordinators)
      .where(eq(chapterCoordinators.email, email.trim()))
      .limit(1)

    if (existingCoordinator.length > 0 && existingCoordinator[0].id !== session.id) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 })
    }

    // Update coordinator profile
    await db
      .update(chapterCoordinators)
      .set({
        name: name.trim(),
        email: email.trim(),
        updatedAt: new Date()
      })
      .where(eq(chapterCoordinators.id, session.id!))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error updating coordinator profile:", error)
    return NextResponse.json(
      { error: "Failed to update coordinator profile" },
      { status: 500 }
    )
  }
}
