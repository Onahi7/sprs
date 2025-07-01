import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ session: null })
    }
    
    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
