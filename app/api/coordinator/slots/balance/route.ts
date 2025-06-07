import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getRealtimeSlotBalance } from "@/db/coordinator-slots-utils"

export async function GET() {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const coordinatorId = session.id!

    // Get current slot balance
    const balance = await getRealtimeSlotBalance(coordinatorId)

    if (!balance.success) {
      return NextResponse.json({
        success: false,
        error: balance.message || "Failed to fetch slot balance"
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      availableSlots: balance.availableSlots,
      usedSlots: balance.usedSlots,
      totalPurchasedSlots: balance.totalPurchasedSlots,
      lastPurchaseDate: balance.lastPurchaseDate,
      lastUsageDate: balance.lastUsageDate
    })
  } catch (error) {
    console.error("Error fetching slot balance:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to fetch slot balance"
    }, { status: 500 })
  }
}
