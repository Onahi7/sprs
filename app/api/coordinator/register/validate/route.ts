import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { validateCoordinatorRegistration, getRealtimeSlotBalance } from "@/db/coordinator-slots-utils"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }    const coordinatorId = session.id!
    const { searchParams } = new URL(request.url)
    const slotsRequired = Number.parseInt(searchParams.get("slots") || "1")

    // Validate coordinator can register with required slots
    const validation = await validateCoordinatorRegistration(coordinatorId, slotsRequired)
    
    // Get current slot balance
    const balance = await getRealtimeSlotBalance(coordinatorId)

    return NextResponse.json({
      canRegister: validation.canRegister,
      message: validation.message,
      slotsRequired,
      balance: balance.success ? {
        availableSlots: balance.availableSlots,
        usedSlots: balance.usedSlots,
        totalPurchasedSlots: balance.totalPurchasedSlots
      } : null
    })
  } catch (error) {
    console.error("Error validating coordinator slots:", error)
    return NextResponse.json(
      { error: "Failed to validate slot balance" },
      { status: 500 }
    )
  }
}
