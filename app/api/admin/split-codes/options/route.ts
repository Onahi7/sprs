import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapters, slotPackages } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDbConnection()
    
    const [allChapters, allPackages] = await Promise.all([
      db.select().from(chapters).orderBy(chapters.name),
      db.select().from(slotPackages).where(eq(slotPackages.isActive, true)).orderBy(slotPackages.slotCount)
    ])

    return NextResponse.json({ 
      chapters: allChapters,
      packages: allPackages
    })
  } catch (error) {
    console.error("Error fetching chapters and packages:", error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
