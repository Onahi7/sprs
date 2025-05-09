import { NextResponse } from "next/server"
import { db } from "@/db"
import { centers } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")

    const query = db.query.centers
    let result

    if (chapterId) {
      const id = Number.parseInt(chapterId)
      if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
      }

      result = await query.findMany({
        where: eq(centers.chapterId, id),
        orderBy: (centers, { asc }) => [asc(centers.name)],
      })
    } else {
      result = await query.findMany({
        orderBy: (centers, { asc }) => [asc(centers.name)],
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching centers:", error)
    return NextResponse.json({ error: "Failed to fetch centers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, chapterId } = await request.json()

    if (!name || !chapterId) {
      return NextResponse.json({ error: "Name and chapter ID are required" }, { status: 400 })
    }

    const newCenter = await db
      .insert(centers)
      .values({
        name,
        chapterId,
      })
      .returning()

    return NextResponse.json(newCenter[0], { status: 201 })
  } catch (error) {
    console.error("Error creating center:", error)
    return NextResponse.json({ error: "Failed to create center" }, { status: 500 })
  }
}
