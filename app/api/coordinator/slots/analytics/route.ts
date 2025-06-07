import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { 
  slotPurchases, 
  slotUsageHistory, 
  coordinatorSlots,
  slotPackages,
  chapterCoordinators,
  chapters
} from "@/db/schema"
import { eq, desc, gte, sql, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const periodDays = parseInt(period)

    const periodDate = new Date()
    periodDate.setDate(periodDate.getDate() - periodDays)

    console.log('🔍 Fetching slot analytics for coordinator:', session.id, 'period:', periodDays, 'days')

    // Get coordinator's chapter info
    const dbConn = getDbConnection()
    const coordinatorInfo = await dbConn
      .select({
        chapterId: chapterCoordinators.chapterId,
        chapterName: chapters.name,
        splitCode: chapters.splitCode,
      })
      .from(chapterCoordinators)
      .leftJoin(chapters, eq(chapterCoordinators.chapterId, chapters.id))
      .where(eq(chapterCoordinators.id, session.id!))
      .limit(1)

    if (coordinatorInfo.length === 0) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 })
    }

    const { chapterId, chapterName, splitCode } = coordinatorInfo[0]

    // Get current slot balance
    const currentSlots = await dbConn
      .select()
      .from(coordinatorSlots)
      .where(eq(coordinatorSlots.coordinatorId, session.id!))
      .limit(1)

    // Get purchase analytics for the period
    const purchaseAnalytics = await dbConn
      .select({
        totalPurchases: sql<number>`COUNT(*)`,
        totalSlotsPurchased: sql<number>`SUM(${slotPurchases.slotsPurchased})`,
        totalAmountSpent: sql<number>`SUM(CASE WHEN ${slotPurchases.paymentStatus} = 'success' THEN ${slotPurchases.amountPaid}::numeric ELSE 0 END)`,
        successfulPurchases: sql<number>`COUNT(CASE WHEN ${slotPurchases.paymentStatus} = 'success' THEN 1 END)`,
        pendingPurchases: sql<number>`COUNT(CASE WHEN ${slotPurchases.paymentStatus} = 'pending' THEN 1 END)`,
        failedPurchases: sql<number>`COUNT(CASE WHEN ${slotPurchases.paymentStatus} IN ('failed', 'abandoned') THEN 1 END)`,
      })
      .from(slotPurchases)
      .where(
        and(
          eq(slotPurchases.coordinatorId, session.id!),
          gte(slotPurchases.createdAt, periodDate)
        )
      )

    // Get usage analytics for the period
    const usageAnalytics = await dbConn
      .select({
        totalUsages: sql<number>`COUNT(*)`,
        totalSlotsUsed: sql<number>`SUM(${slotUsageHistory.slotsUsed})`,
        registrationUsages: sql<number>`COUNT(CASE WHEN ${slotUsageHistory.usageType} = 'registration' THEN 1 END)`,
        adjustmentUsages: sql<number>`COUNT(CASE WHEN ${slotUsageHistory.usageType} = 'adjustment' THEN 1 END)`,
      })
      .from(slotUsageHistory)
      .where(
        and(
          eq(slotUsageHistory.coordinatorId, session.id!),
          gte(slotUsageHistory.createdAt, periodDate)
        )
      )

    // Get recent purchases (last 10)
    const recentPurchases = await dbConn
      .select({
        id: slotPurchases.id,
        reference: slotPurchases.paymentReference,
        slotsPurchased: slotPurchases.slotsPurchased,
        amountPaid: slotPurchases.amountPaid,
        paymentStatus: slotPurchases.paymentStatus,
        purchaseDate: slotPurchases.createdAt,
        packageName: slotPackages.name,
      })
      .from(slotPurchases)
      .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
      .where(eq(slotPurchases.coordinatorId, session.id!))
      .orderBy(desc(slotPurchases.createdAt))
      .limit(10)

    // Get recent usage (last 15)
    const recentUsage = await dbConn
      .select({
        id: slotUsageHistory.id,
        slotsUsed: slotUsageHistory.slotsUsed,
        usageType: slotUsageHistory.usageType,
        notes: slotUsageHistory.notes,
        createdAt: slotUsageHistory.createdAt,
        registrationId: slotUsageHistory.registrationId,
      })
      .from(slotUsageHistory)
      .where(eq(slotUsageHistory.coordinatorId, session.id!))
      .orderBy(desc(slotUsageHistory.createdAt))
      .limit(15)

    // Get daily usage pattern for the period (last 30 days)
    const dailyPattern = await dbConn
      .select({
        date: sql<string>`DATE(${slotUsageHistory.createdAt})`,
        slotsUsed: sql<number>`SUM(${slotUsageHistory.slotsUsed})`,
        usageCount: sql<number>`COUNT(*)`,
      })
      .from(slotUsageHistory)
      .where(
        and(
          eq(slotUsageHistory.coordinatorId, session.id!),
          gte(slotUsageHistory.createdAt, periodDate)
        )
      )
      .groupBy(sql`DATE(${slotUsageHistory.createdAt})`)
      .orderBy(sql`DATE(${slotUsageHistory.createdAt}) DESC`)

    // Calculate efficiency metrics
    const totalSlotsPurchased = purchaseAnalytics[0]?.totalSlotsPurchased || 0
    const totalSlotsUsed = currentSlots[0]?.usedSlots || 0
    const utilization = totalSlotsPurchased > 0 ? (totalSlotsUsed / totalSlotsPurchased) * 100 : 0
    const availableSlots = currentSlots[0]?.availableSlots || 0
    const burnRate = usageAnalytics[0]?.totalSlotsUsed || 0 // slots used in the period

    const analytics = {
      period: {
        days: periodDays,
        startDate: periodDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      coordinator: {
        chapterId,
        chapterName,
        splitCode,
      },
      balance: {
        availableSlots,
        usedSlots: totalSlotsUsed,
        totalPurchasedSlots: totalSlotsPurchased,
        utilizationPercentage: Number(utilization.toFixed(1)),
      },
      purchases: {
        total: purchaseAnalytics[0]?.totalPurchases || 0,
        successful: purchaseAnalytics[0]?.successfulPurchases || 0,
        pending: purchaseAnalytics[0]?.pendingPurchases || 0,
        failed: purchaseAnalytics[0]?.failedPurchases || 0,
        totalSlotsPurchased: purchaseAnalytics[0]?.totalSlotsPurchased || 0,
        totalAmountSpent: Number(purchaseAnalytics[0]?.totalAmountSpent || 0),
        successRate: purchaseAnalytics[0]?.totalPurchases > 0 
          ? Number(((purchaseAnalytics[0]?.successfulPurchases || 0) / purchaseAnalytics[0].totalPurchases * 100).toFixed(1))
          : 0,
      },
      usage: {
        total: usageAnalytics[0]?.totalUsages || 0,
        totalSlotsUsed: usageAnalytics[0]?.totalSlotsUsed || 0,
        registrations: usageAnalytics[0]?.registrationUsages || 0,
        adjustments: usageAnalytics[0]?.adjustmentUsages || 0,
        burnRate: Number((burnRate / periodDays).toFixed(2)), // slots per day
        projectedRunout: availableSlots > 0 && burnRate > 0 
          ? Math.ceil(availableSlots / (burnRate / periodDays))
          : null, // days until slots run out
      },
      trends: {
        dailyPattern: dailyPattern.map(d => ({
          date: d.date,
          slotsUsed: d.slotsUsed,
          usageCount: d.usageCount,
        })),
        averageDailyUsage: dailyPattern.length > 0 
          ? Number((dailyPattern.reduce((sum, d) => sum + d.slotsUsed, 0) / dailyPattern.length).toFixed(2))
          : 0,
      },
      recent: {
        purchases: recentPurchases.map(p => ({
           id: p.id,
           reference: p.reference,
           slotsPurchased: p.slotsPurchased,
           amountPaid: parseFloat(p.amountPaid),
           paymentStatus: p.paymentStatus,
           purchaseDate: p.purchaseDate?.toISOString() || '',
           packageName: p.packageName || 'Unknown Package',
         })),
        usage: recentUsage.map(u => ({
           id: u.id,
           slotsUsed: u.slotsUsed,
           usageType: u.usageType,
           notes: u.notes,
           createdAt: u.createdAt?.toISOString() || '',
           registrationId: u.registrationId,
         })),
      },
    }

    console.log('✅ Slot analytics calculated:', {
      period: analytics.period,
      balance: analytics.balance,
      utilization: analytics.balance.utilizationPercentage + '%',
      burnRate: analytics.usage.burnRate + ' slots/day',
    })

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('❌ Error fetching slot analytics:', error)
    return NextResponse.json(
      { 
        error: "Failed to fetch slot analytics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
