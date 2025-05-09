import { NextResponse } from "next/server"
import { chapters } from "@/db/schema"
import { desc } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export async function GET() {
  try {
    const db = getDbConnection();
    const allChapters = await db.query.chapters.findMany({
      orderBy: [desc(chapters.name)],
    })

    return NextResponse.json(allChapters)
  } catch (error) {
    console.error("Error fetching chapters:", error)
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, splitCode, amount } = await request.json()
    const db = getDbConnection();

    const newChapter = await db
      .insert(chapters)
      .values({
        name,
        splitCode: splitCode || null,
        amount: amount || "3000.00",
      })
      .returning()

    return NextResponse.json(newChapter[0], { status: 201 })
  } catch (error) {
    console.error("Error creating chapter:", error)
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 })
  }
}
