import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { coordinatorSlots, slotUsageHistory, chapterCoordinators } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { coordinatorId, slotsToAdd, reason } = await request.json()
    
    if (!coordinatorId || !slotsToAdd || slotsToAdd <= 0) {
      return NextResponse.json({ 
        error: "Coordinator ID and valid slots count are required" 
      }, { status: 400 })
    }

    if (slotsToAdd > 1000) {
      return NextResponse.json({ 
        error: "Cannot add more than 1000 slots at once" 
      }, { status: 400 })
    }

    const db = getDbConnection()
    
    // First, verify the coordinator exists and is active
    const coordinator = await db
      .select({
        id: chapterCoordinators.id,
        name: chapterCoordinators.name,
        chapterId: chapterCoordinators.chapterId,
        isActive: chapterCoordinators.isActive
      })
      .from(chapterCoordinators)
      .where(eq(chapterCoordinators.id, coordinatorId))
      .limit(1)

    if (coordinator.length === 0) {
      return NextResponse.json({ 
        error: "Coordinator not found" 
      }, { status: 404 })
    }

    if (!coordinator[0].isActive) {
      return NextResponse.json({ 
        error: "Cannot add slots to inactive coordinator" 
      }, { status: 400 })
    }

    // Check if coordinator has a slot record, if not create one
    let currentSlots = await db
      .select()
      .from(coordinatorSlots)
      .where(eq(coordinatorSlots.coordinatorId, coordinatorId))
      .limit(1)

    if (currentSlots.length === 0) {
      // Create initial slot record for coordinator
      await db
        .insert(coordinatorSlots)
        .values({
          coordinatorId,
          chapterId: coordinator[0].chapterId,
          availableSlots: 0,
          usedSlots: 0,
          totalPurchasedSlots: 0,
        })
      
      // Fetch the newly created record
      currentSlots = await db
        .select()
        .from(coordinatorSlots)
        .where(eq(coordinatorSlots.coordinatorId, coordinatorId))
        .limit(1)
    }

    const currentBalance = currentSlots[0]
    
    // Update coordinator slots
    const updatedSlots = await db
      .update(coordinatorSlots)
      .set({
        availableSlots: sql`${coordinatorSlots.availableSlots} + ${slotsToAdd}`,
        totalPurchasedSlots: sql`${coordinatorSlots.totalPurchasedSlots} + ${slotsToAdd}`,
        lastPurchaseDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coordinatorSlots.coordinatorId, coordinatorId))
      .returning()

    if (updatedSlots.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update coordinator slots" 
      }, { status: 500 })
    }    // Record this admin action in the usage history
    await db
      .insert(slotUsageHistory)
      .values({
        coordinatorId,
        slotsUsed: -slotsToAdd, // Negative to indicate addition
        usageType: 'adjustment',
        notes: `Admin added ${slotsToAdd} slots. Reason: ${reason || 'No reason provided'}. Admin: ${session.username || `ID:${session.id}` || 'Unknown'}`,
        createdAt: new Date(),
      })

    const newBalance = updatedSlots[0]

    return NextResponse.json({
      success: true,
      message: `Successfully added ${slotsToAdd} slots to ${coordinator[0].name}`,
      coordinatorName: coordinator[0].name,
      slotsAdded: slotsToAdd,
      previousBalance: currentBalance.availableSlots || 0,
      newBalance: newBalance.availableSlots || 0,
      totalPurchased: newBalance.totalPurchasedSlots || 0,
      reason: reason || 'No reason provided'
    })

  } catch (error) {
    console.error("Error adding slots to coordinator:", error)
    return NextResponse.json(
      { error: "Failed to add slots to coordinator" },
      { status: 500 }
    )
  }
}
