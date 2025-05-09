import { NextResponse } from "next/server"
import { db } from "@/db"
import { chapterCoordinators } from "@/db/schema"
import { generateUniqueCode } from "@/lib/utils"

export async function GET() {
  try {
    const coordinators = await db.query.chapterCoordinators.findMany({
      with: {
        chapter: true,
      },
      orderBy: (chapterCoordinators, { asc }) => [asc(chapterCoordinators.name)],
    })

    return NextResponse.json(coordinators)
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
