import { NextResponse } from "next/server"
import { schools } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")
    const db = getDbConnection();

    const query = db.query.schools
    let result

    if (chapterId) {
      const id = Number.parseInt(chapterId)
      if (isNaN(id)) {
        return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
      }

      result = await query.findMany({
        where: eq(schools.chapterId, id),
        orderBy: (schools, { asc }) => [asc(schools.name)],
      })
    } else {
      result = await query.findMany({
        orderBy: (schools, { asc }) => [asc(schools.name)],
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching schools:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, chapterId } = await request.json()
    const db = getDbConnection();

    if (!name || !chapterId) {
      return NextResponse.json({ error: "Name and chapter ID are required" }, { status: 400 })
    }

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
