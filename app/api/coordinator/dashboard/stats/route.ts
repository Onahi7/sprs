import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, schools, centers, chapters } from "@/db/schema"
import { eq, count } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const chapterId = parseInt(searchParams.get("chapterId") || session.chapterId?.toString() || "0", 10)
    
    // Verify the coordinator has access to this chapter
    if (session.chapterId !== chapterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
    
    // Get chapter name
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, chapterId),
    })

    // Get total registrations for this chapter
    const totalRegistrationsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.chapterId, chapterId))

    // Get pending payments for this chapter
    const pendingPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.chapterId, chapterId))
      .where(eq(registrations.paymentStatus, "pending"))
      
    // Get completed payments for this chapter
    const completedPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.chapterId, chapterId))
      .where(eq(registrations.paymentStatus, "completed"))

    // Get total schools for this chapter
    const totalSchoolsResult = await db
      .select({ count: count() })
      .from(schools)
      .where(eq(schools.chapterId, chapterId))

    // Get total centers for this chapter
    const totalCentersResult = await db
      .select({ count: count() })
      .from(centers)
      .where(eq(centers.chapterId, chapterId))

    return NextResponse.json({
      totalRegistrations: totalRegistrationsResult[0].count,
      pendingPayments: pendingPaymentsResult[0].count,
      confirmedRegistrations: completedPaymentsResult[0].count,
      totalSchools: totalSchoolsResult[0].count,
      totalCenters: totalCentersResult[0].count,
      chapterId,
      chapterName: chapter?.name || "Unknown Chapter",
    })
  } catch (error) {
    console.error("Error fetching coordinator stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
