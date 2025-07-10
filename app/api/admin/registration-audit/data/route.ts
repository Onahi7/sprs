import { NextResponse } from "next/server"
import { db } from "@/db"
import { chapters, registrations, slotPurchases, chapterCoordinators } from "@/db/schema"
import { eq, and, sql, isNotNull } from "drizzle-orm"

export async function GET() {
  try {
    // Get all chapters with registration counts and slot data
    const chaptersData = await db
      .select({
        id: chapters.id,
        name: chapters.name,
        slotRegistrationCount: sql<number>`
          CAST(COALESCE(
            (SELECT COUNT(*) FROM ${registrations} r 
             WHERE r.chapter_id = ${chapters.id} 
             AND r.payment_status = 'completed' 
             AND r.coordinator_registered_by IS NOT NULL), 
            0
          ) AS INTEGER)
        `,
        singularRegistrationCount: sql<number>`
          CAST(COALESCE(
            (SELECT COUNT(*) FROM ${registrations} r 
             WHERE r.chapter_id = ${chapters.id} 
             AND r.payment_status = 'completed' 
             AND r.coordinator_registered_by IS NULL), 
            0
          ) AS INTEGER)
        `,
        totalRegistrationCount: sql<number>`
          CAST(COALESCE(
            (SELECT COUNT(*) FROM ${registrations} r 
             WHERE r.chapter_id = ${chapters.id} 
             AND r.payment_status = 'completed'), 
            0
          ) AS INTEGER)
        `,
        totalSlotsSold: sql<number>`
          CAST(COALESCE(
            (SELECT SUM(sp.slots_purchased) FROM ${slotPurchases} sp 
             WHERE sp.chapter_id = ${chapters.id} 
             AND sp.payment_status = 'completed'), 
            0
          ) AS INTEGER)
        `
      })
      .from(chapters)

    // Calculate summary totals
    const summary = {
      totalChapters: chaptersData.length,
      totalSlotRegistrations: chaptersData.reduce((sum, ch) => sum + ch.slotRegistrationCount, 0),
      totalSingularRegistrations: chaptersData.reduce((sum, ch) => sum + ch.singularRegistrationCount, 0),
      totalRegistrations: chaptersData.reduce((sum, ch) => sum + ch.totalRegistrationCount, 0),
      totalSlotsSold: chaptersData.reduce((sum, ch) => sum + ch.totalSlotsSold, 0),
      totalRevenue: 0 // Can be calculated if needed
    }

    return NextResponse.json({
      chapters: chaptersData,
      summary
    })

  } catch (error) {
    console.error("Error fetching registration audit data:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit data" },
      { status: 500 }
    )
  }
}
