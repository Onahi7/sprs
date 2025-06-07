import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { count, sql, eq } from "drizzle-orm"

export async function GET() {
  console.log("Dashboard stats API: Request received")
  try {
    console.log("Dashboard stats API: Getting session")
    const session = await getSession()
    console.log("Dashboard stats API: Session result:", JSON.stringify(session))
    
    if (!session || session.role !== "admin") {
      console.log("Dashboard stats API: Unauthorized - no valid admin session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    console.log("Dashboard stats API: Getting database connection")
    const db = getDbConnection()
    
    // Get total registrations
    // Fallback to raw SQL to ensure correct count
    const totalRegistrationsSql = await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM ${registrations}
    `)
    const totalRegistrations = totalRegistrationsSql.rows[0]?.count || 0

    // Get pending registration payments
    const pendingPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "pending"))
    const pendingPayments = Number(pendingPaymentsResult[0].count) || 0

    // Get completed registration payments
    const completedPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "completed"))
    const confirmedRegistrations = Number(completedPaymentsResult[0].count) || 0

    // Get total chapters
    const totalChaptersResult = await db.select({ count: count() }).from(chapters)
    const totalChapters = Number(totalChaptersResult[0].count) || 0

    // Get total schools
    const totalSchoolsResult = await db.select({ count: count() }).from(schools)
    const totalSchools = Number(totalSchoolsResult[0].count) || 0

    // Get total centers
    const totalCentersResult = await db.select({ count: count() }).from(centers)
    const totalCenters = Number(totalCentersResult[0].count) || 0

    // Get total revenue from completed exam registrations
    const revenueResult = await db.execute(sql`
      SELECT SUM(c.amount) AS total_revenue
      FROM ${registrations} r
      JOIN ${chapters} c ON r.chapter_id = c.id
      WHERE r.payment_status = 'completed'
    `)
    const totalRevenue = revenueResult.rows[0]?.total_revenue || 0

    return NextResponse.json({
      totalRegistrations,
      pendingPayments,
      confirmedRegistrations,
      totalChapters,
      totalSchools,
      totalCenters,
      totalRevenue: Number(totalRevenue),
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
