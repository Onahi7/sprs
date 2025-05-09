import { NextResponse } from "next/server"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { count, eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export async function GET() {
  try {
    // Get a database connection
    const dbConnection = getDbConnection();
    
    // Get total registrations
    const totalRegistrationsResult = await dbConnection.select({ count: count() }).from(registrations)

    // Get completed payments
    const completedPaymentsResult = await dbConnection
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "completed"))

    // Get total chapters
    const totalChaptersResult = await dbConnection.select({ count: count() }).from(chapters)

    // Get total schools
    const totalSchoolsResult = await dbConnection.select({ count: count() }).from(schools)

    // Get total centers
    const totalCentersResult = await dbConnection.select({ count: count() }).from(centers)

    // Calculate completion rate
    const completionRate =
      totalRegistrationsResult[0].count > 0
        ? (completedPaymentsResult[0].count / totalRegistrationsResult[0].count) * 100
        : 0

    return NextResponse.json({
      totalRegistrations: totalRegistrationsResult[0].count,
      completedPayments: completedPaymentsResult[0].count,
      totalChapters: totalChaptersResult[0].count,
      totalSchools: totalSchoolsResult[0].count,
      totalCenters: totalCentersResult[0].count,
      completionRate: Number.parseFloat(completionRate.toFixed(1)),
    })

  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
