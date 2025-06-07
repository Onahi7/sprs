import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { 
  getCoordinatorSlots, 
  getSlotPackagesForChapter,
  getCoordinatorDashboardStats,
  validateSlotPurchase,
  createSlotPurchase
} from "@/db/coordinator-slots-utils"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "balance":
        const slotInfo = await getCoordinatorSlots(session.id!)
        return NextResponse.json({ 
          slots: slotInfo || {
            availableSlots: 0,
            usedSlots: 0,
            totalPurchasedSlots: 0
          }
        })

      case "packages": 
        const packages = await getSlotPackagesForChapter(session.chapterId!)
        return NextResponse.json({ packages })

      case "dashboard":
        const dashboardStats = await getCoordinatorDashboardStats(session.id!)
        return NextResponse.json(dashboardStats)

      default:
        // Return both balance and packages
        const [slots, packageList] = await Promise.all([
          getCoordinatorSlots(session.id!),
          getSlotPackagesForChapter(session.chapterId!)
        ])
        
        return NextResponse.json({ 
          slots: slots || {
            availableSlots: 0,
            usedSlots: 0,
            totalPurchasedSlots: 0
          },
          packages: packageList
        })
    }
  } catch (error) {
    console.error("Error in coordinator slots API:", error)
    return NextResponse.json(
      { error: "Failed to fetch slot data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, slotPackageId } = body

    if (action === "initiate-purchase") {
      // Validate the purchase request
      const validation = await validateSlotPurchase({
        coordinatorId: session.id!,
        chapterId: session.chapterId!,
        slotPackageId: parseInt(slotPackageId)
      })

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }

      // Generate unique payment reference
      const paymentReference = `SLOT_${session.id!}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Create the purchase record
      const purchase = await createSlotPurchase({
        coordinatorId: session.id!,
        chapterId: session.chapterId!,
        slotPackageId: parseInt(slotPackageId),
        slotsPurchased: validation.package!.slotCount,
        amountPaid: validation.package!.price,
        paymentReference,
        splitCodeUsed: validation.splitCode!
      })

      return NextResponse.json({
        success: true,
        paymentReference,
        amount: validation.package!.price,
        splitCode: validation.splitCode,
        package: validation.package,
        purchaseId: purchase.id
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error in coordinator slots POST:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
