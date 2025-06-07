import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { slotPurchases, slotPackages } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Fetching payment history for coordinator:', session.id)

    // Fetch purchase history
    const dbConn = getDbConnection()
    const history = await dbConn
      .select({
        id: slotPurchases.id,
        reference: slotPurchases.paymentReference,
        slotsPurchased: slotPurchases.slotsPurchased,
        amountPaid: slotPurchases.amountPaid,
        paymentStatus: slotPurchases.paymentStatus,
        purchaseDate: slotPurchases.createdAt,
        packageName: slotPackages.name,
        transactionId: slotPurchases.paystackReference,
      })
      .from(slotPurchases)
      .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
      .where(eq(slotPurchases.coordinatorId, session.id!))
      .orderBy(desc(slotPurchases.createdAt))

    // Calculate summary statistics
    const summary = {
      totalPurchases: history.length,
      totalSlotsPurchased: history.reduce((sum, h) => sum + h.slotsPurchased, 0),
      totalAmountSpent: history
        .filter(h => h.paymentStatus === 'completed')
        .reduce((sum, h) => sum + parseFloat(h.amountPaid), 0),
      successfulPayments: history.filter(h => h.paymentStatus === 'completed').length,
      pendingPayments: history.filter(h => h.paymentStatus === 'pending').length,
      failedPayments: history.filter(h => h.paymentStatus === 'failed').length,
    }

    // Format the history data
    const formattedHistory = history.map(h => ({
      id: h.id,
      reference: h.reference,
      slotsPurchased: h.slotsPurchased,
      amountPaid: parseFloat(h.amountPaid),
      paymentStatus: h.paymentStatus,
      purchaseDate: h.purchaseDate?.toISOString() || '',
      packageName: h.packageName || 'Unknown Package',
      transactionId: h.transactionId,
    }))

    console.log('✅ Payment history fetched:', {
      historyCount: formattedHistory.length,
      summary
    })

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      summary
    })

  } catch (error) {
    console.error('❌ Error fetching payment history:', error)
    return NextResponse.json(
      { 
        error: "Failed to fetch payment history",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
