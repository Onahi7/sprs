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
    const totalRegistrationsResult = await db.select({ count: count() }).from(registrations)

    // Get pending payments
    const pendingPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "pending"))
      
    // Get completed payments
    const completedPaymentsResult = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "completed"))

    // Get total chapters
    const totalChaptersResult = await db.select({ count: count() }).from(chapters)

    // Get total schools
    const totalSchoolsResult = await db.select({ count: count() }).from(schools)

    // Get total centers
    const totalCentersResult = await db.select({ count: count() }).from(centers)

    // Get total revenue
    const totalRevenueResult = await db.execute(sql`
      SELECT SUM(c.exam_fee) as total_revenue
      FROM ${registrations} r
      JOIN ${chapters} c ON r.chapter_id = c.id
      WHERE r.payment_status = 'completed'
    `)

    const totalRevenue = totalRevenueResult.rows[0]?.total_revenue || 0

    return NextResponse.json({
      totalRegistrations: totalRegistrationsResult[0].count,
      pendingPayments: pendingPaymentsResult[0].count,
      confirmedRegistrations: completedPaymentsResult[0].count,
      totalChapters: totalChaptersResult[0].count,
      totalSchools: totalSchoolsResult[0].count,
      totalCenters: totalCentersResult[0].count,
      totalRevenue: Number(totalRevenue),
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
