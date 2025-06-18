import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapters } from "@/db/schema"
import { asc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
    
    const chaptersList = await db
      .select({
        id: chapters.id,
        name: chapters.name,
      })
      .from(chapters)
      .orderBy(asc(chapters.name))
    
    return NextResponse.json({
      success: true,
      chapters: chaptersList
    })
    
  } catch (error) {
    console.error("Error fetching chapters:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    )
  }
}
