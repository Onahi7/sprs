/**
 * Coordinator Slots Utility Functions
 * Helper functions for managing coordinator slots
 */

import { getDbConnection } from './utils'
import { 
  chapterCoordinators, 
  coordinatorSlots, 
  slotPurchases, 
  slotPackages,
  chapterSplitCodes,
  slotUsageHistory,
  chapters
} from './schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export interface CoordinatorSlotInfo {
  coordinatorId: number
  chapterId: number
  availableSlots: number
  usedSlots: number
  totalPurchasedSlots: number
  lastPurchaseDate?: Date
  lastUsageDate?: Date
}

export interface SlotPackageInfo {
  id: number
  name: string
  slotCount: number
  price: string
  description?: string
  splitCode?: string
}

/**
 * Get coordinator slot information
 */
export async function getCoordinatorSlots(coordinatorId: number): Promise<CoordinatorSlotInfo | null> {
  try {
    const db = getDbConnection()
    const result = await db
      .select()
      .from(coordinatorSlots)
      .where(eq(coordinatorSlots.coordinatorId, coordinatorId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const slot = result[0]
    return {
      coordinatorId: slot.coordinatorId!,
      chapterId: slot.chapterId!,
      availableSlots: slot.availableSlots || 0,
      usedSlots: slot.usedSlots || 0,
      totalPurchasedSlots: slot.totalPurchasedSlots || 0,
      lastPurchaseDate: slot.lastPurchaseDate || undefined,
      lastUsageDate: slot.lastUsageDate || undefined,
    }
  } catch (error) {
    console.error('Error getting coordinator slots:', error)
    throw error
  }
}

/**
 * Get available slot packages for a chapter
 */
export async function getSlotPackagesForChapter(chapterId: number): Promise<SlotPackageInfo[]> {
  try {
    const db = getDbConnection()
    
    // First get the chapter amount
    const chapterResult = await db
      .select({ amount: chapters.amount })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1)
    
    if (chapterResult.length === 0) {
      throw new Error(`Chapter with ID ${chapterId} not found`)
    }
    
    const chapterAmount = parseFloat(chapterResult[0].amount || "3000.00")
    
    const result = await db
      .select({
        id: slotPackages.id,
        name: slotPackages.name,
        slotCount: slotPackages.slotCount,
        description: slotPackages.description,
        splitCode: chapterSplitCodes.splitCode,
      })
      .from(slotPackages)
      .leftJoin(
        chapterSplitCodes,
        and(
          eq(chapterSplitCodes.slotPackageId, slotPackages.id),
          eq(chapterSplitCodes.chapterId, chapterId),
          eq(chapterSplitCodes.isActive, true)
        )
      )
      .where(eq(slotPackages.isActive, true))

    return result.map(row => ({
      id: row.id,
      name: row.name,
      slotCount: row.slotCount,
      // Calculate price as slot_count * chapter_amount
      price: (row.slotCount * chapterAmount).toFixed(2),
      description: row.description || undefined,
      splitCode: row.splitCode || undefined,
    }))
  } catch (error) {
    console.error('Error getting slot packages for chapter:', error)
    throw error
  }
}

/**
 * Check if coordinator has sufficient slots
 */
export async function hasAvailableSlots(coordinatorId: number, requiredSlots: number = 1): Promise<boolean> {
  try {
    const slotInfo = await getCoordinatorSlots(coordinatorId)
    return slotInfo ? slotInfo.availableSlots >= requiredSlots : false
  } catch (error) {
    console.error('Error checking available slots:', error)
    return false
  }
}

/**
 * Get coordinator purchase history
 */
export async function getCoordinatorPurchaseHistory(coordinatorId: number, limit: number = 10) {
  try {
    const db = getDbConnection()
    const result = await db
      .select({
        id: slotPurchases.id,
        slotsPurchased: slotPurchases.slotsPurchased,
        amountPaid: slotPurchases.amountPaid,
        paymentStatus: slotPurchases.paymentStatus,
        purchaseDate: slotPurchases.purchaseDate,
        paymentReference: slotPurchases.paymentReference,
        packageName: slotPackages.name,
      })
      .from(slotPurchases)
      .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
      .where(eq(slotPurchases.coordinatorId, coordinatorId))
      .orderBy(desc(slotPurchases.purchaseDate))
      .limit(limit)

    return result
  } catch (error) {
    console.error('Error getting purchase history:', error)
    throw error
  }
}

/**
 * Get coordinator usage history
 */
export async function getCoordinatorUsageHistory(coordinatorId: number, limit: number = 20) {
  try {
    const db = getDbConnection()
    const result = await db
      .select({
        id: slotUsageHistory.id,
        slotsUsed: slotUsageHistory.slotsUsed,
        usageType: slotUsageHistory.usageType,
        notes: slotUsageHistory.notes,
        createdAt: slotUsageHistory.createdAt,
        registrationId: slotUsageHistory.registrationId,
      })
      .from(slotUsageHistory)
      .where(eq(slotUsageHistory.coordinatorId, coordinatorId))
      .orderBy(desc(slotUsageHistory.createdAt))
      .limit(limit)

    return result
  } catch (error) {
    console.error('Error getting usage history:', error)
    throw error
  }
}

/**
 * Initialize coordinator slots (for new coordinators)
 */
export async function initializeCoordinatorSlots(coordinatorId: number, chapterId: number) {
  try {
    const db = getDbConnection()
    await db
      .insert(coordinatorSlots)
      .values({
        coordinatorId,
        chapterId,
        availableSlots: 0,
        usedSlots: 0,
        totalPurchasedSlots: 0,
      })
      .onConflictDoNothing()

    return true
  } catch (error) {
    console.error('Error initializing coordinator slots:', error)
    throw error
  }
}

/**
 * Create a slot purchase record
 */
export async function createSlotPurchase(data: {
  coordinatorId: number
  chapterId: number
  slotPackageId: number
  slotsPurchased: number
  amountPaid: string
  paymentReference: string
  splitCodeUsed: string
}) {
  try {
    const db = getDbConnection()
    const result = await db
      .insert(slotPurchases)
      .values({
        coordinatorId: data.coordinatorId,
        chapterId: data.chapterId,
        slotPackageId: data.slotPackageId,
        slotsPurchased: data.slotsPurchased,
        amountPaid: data.amountPaid,
        paymentReference: data.paymentReference,
        splitCodeUsed: data.splitCodeUsed,
        paymentStatus: 'pending',
      })
      .returning()

    return result[0]
  } catch (error) {
    console.error('Error creating slot purchase:', error)
    throw error
  }
}

/**
 * Update slot purchase status
 */
export async function updateSlotPurchaseStatus(
  paymentReference: string, 
  status: 'pending' | 'completed' | 'failed',
  paystackReference?: string
) {
  try {
    const db = getDbConnection()
    const result = await db
      .update(slotPurchases)
      .set({
        paymentStatus: status,
        paystackReference,
        paymentVerifiedAt: status === 'completed' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(slotPurchases.paymentReference, paymentReference))
      .returning()

    return result[0]
  } catch (error) {
    console.error('Error updating slot purchase status:', error)
    throw error
  }
}

/**
 * Get dashboard statistics for coordinator
 */
export async function getCoordinatorDashboardStats(coordinatorId: number) {
  try {
    const slotInfo = await getCoordinatorSlots(coordinatorId)
    const recentPurchases = await getCoordinatorPurchaseHistory(coordinatorId, 3)
    const recentUsage = await getCoordinatorUsageHistory(coordinatorId, 5)

    return {
      slots: slotInfo,
      recentPurchases,
      recentUsage,
    }
  } catch (error) {
    console.error('Error getting coordinator dashboard stats:', error)
    throw error
  }
}

/**
 * Validate slot purchase before payment
 */
export async function validateSlotPurchase(data: {
  coordinatorId: number
  chapterId: number
  slotPackageId: number
}) {
  try {
    const db = getDbConnection()
    
    // Check if coordinator exists and belongs to the chapter
    const coordinator = await db
      .select()
      .from(chapterCoordinators)
      .where(
        and(
          eq(chapterCoordinators.id, data.coordinatorId),
          eq(chapterCoordinators.chapterId, data.chapterId),
          eq(chapterCoordinators.isActive, true)
        )
      )
      .limit(1)

    if (coordinator.length === 0) {
      return { valid: false, error: 'Coordinator not found or inactive' }
    }

    // Get chapter amount for price calculation
    const chapterResult = await db
      .select({ amount: chapters.amount })
      .from(chapters)
      .where(eq(chapters.id, data.chapterId))
      .limit(1)

    if (chapterResult.length === 0) {
      return { valid: false, error: 'Chapter not found' }
    }

    const chapterAmount = parseFloat(chapterResult[0].amount || "3000.00")

    // Check if slot package exists and is active
    const package_ = await db
      .select()
      .from(slotPackages)
      .where(
        and(
          eq(slotPackages.id, data.slotPackageId),
          eq(slotPackages.isActive, true)
        )
      )
      .limit(1)

    if (package_.length === 0) {
      return { valid: false, error: 'Slot package not found or inactive' }
    }

    // Check if split code exists for this chapter and package
    const splitCode = await db
      .select()
      .from(chapterSplitCodes)
      .where(
        and(
          eq(chapterSplitCodes.chapterId, data.chapterId),
          eq(chapterSplitCodes.slotPackageId, data.slotPackageId),
          eq(chapterSplitCodes.isActive, true)
        )
      )
      .limit(1)

    if (splitCode.length === 0) {
      return { valid: false, error: 'Split code not configured for this chapter and package' }
    }

    // Calculate the actual price based on slot count and chapter amount
    const packageWithPrice = {
      ...package_[0],
      price: (package_[0].slotCount * chapterAmount).toFixed(2)
    }

    return { 
      valid: true, 
      package: packageWithPrice,
      splitCode: splitCode[0].splitCode,
      coordinator: coordinator[0]
    }
  } catch (error) {
    console.error('Error validating slot purchase:', error)
    return { valid: false, error: 'Validation failed' }
  }
}

/**
 * Use slots for registration and record usage
 */
export async function useCoordinatorSlots(
  coordinatorId: number, 
  registrationId: number, 
  slotsToUse: number = 1,
  usageType: 'registration' | 'bulk_registration' | 'adjustment' = 'registration',
  notes?: string
): Promise<{ success: boolean; message: string; remainingSlots?: number }> {
  try {
    const db = getDbConnection()
    // Begin transaction-like operation
    const currentSlots = await getCoordinatorSlots(coordinatorId)
    if (!currentSlots) {
      return { success: false, message: 'Coordinator slot record not found' }
    }

    // Prevent duplicate slot usage for the same registration
    const existingUsage = await db
      .select()
      .from(slotUsageHistory)
      .where(
        and(
          eq(slotUsageHistory.registrationId, registrationId),
          eq(slotUsageHistory.usageType, 'registration')
        )
      )
      .limit(1)
    if (existingUsage.length > 0) {
      console.log(`⚠️ Duplicate slot deduction skipped for registration ${registrationId}`)
      return { success: true, message: 'Slots already deducted for this registration', remainingSlots: currentSlots.availableSlots }
    }

    // Check if sufficient slots are available
    if (currentSlots.availableSlots < slotsToUse) {
      return { 
        success: false, 
        message: `Insufficient slots. Available: ${currentSlots.availableSlots}, Required: ${slotsToUse}` 
      }
    }

    // Update coordinator slots
    const updatedSlots = await db
      .update(coordinatorSlots)
      .set({
        availableSlots: currentSlots.availableSlots - slotsToUse,
        usedSlots: currentSlots.usedSlots + slotsToUse,
        lastUsageDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(coordinatorSlots.coordinatorId, coordinatorId))
      .returning()

    if (updatedSlots.length === 0) {
      return { success: false, message: 'Failed to update slot balance' }
    }    // Record usage in history
    await db
      .insert(slotUsageHistory)      .values({
        coordinatorId,
        registrationId,
        slotsUsed: slotsToUse,
        usageType,
        notes,
      })

    return { 
      success: true, 
      message: `${slotsToUse} slot(s) used successfully`,
      remainingSlots: updatedSlots[0].availableSlots || 0
    }
  } catch (error) {
    console.error('Error using coordinator slots:', error)
    return { success: false, message: 'Failed to process slot usage' }
  }
}

/**
 * Validate coordinator can register students (has sufficient slots)
 */
export async function validateCoordinatorRegistration(
  coordinatorId: number, 
  slotsRequired: number = 1
): Promise<{ canRegister: boolean; message: string; availableSlots?: number }> {
  try {
    const slotInfo = await getCoordinatorSlots(coordinatorId)
    
    if (!slotInfo) {
      return { 
        canRegister: false, 
        message: 'Coordinator slot record not found. Please contact support.' 
      }
    }

    if (slotInfo.availableSlots < slotsRequired) {
      return { 
        canRegister: false, 
        message: `Insufficient slots. You have ${slotInfo.availableSlots} slot(s) but need ${slotsRequired}.`,
        availableSlots: slotInfo.availableSlots
      }
    }

    return { 
      canRegister: true, 
      message: 'Registration can proceed',
      availableSlots: slotInfo.availableSlots
    }
  } catch (error) {
    console.error('Error validating coordinator registration:', error)
    return { 
      canRegister: false, 
      message: 'Unable to validate slot balance. Please try again.' 
    }
  }
}

/**
 * Get real-time slot balance for frontend
 */
export async function getRealtimeSlotBalance(coordinatorId: number): Promise<{
  success: boolean
  availableSlots: number
  usedSlots: number
  totalPurchasedSlots: number
  lastPurchaseDate?: Date
  lastUsageDate?: Date
  message?: string
}> {
  try {
    const slotInfo = await getCoordinatorSlots(coordinatorId)
    
    if (!slotInfo) {
      return {
        success: false,
        availableSlots: 0,
        usedSlots: 0,
        totalPurchasedSlots: 0,
        message: 'Slot record not found'
      }
    }

    return {
      success: true,
      availableSlots: slotInfo.availableSlots,
      usedSlots: slotInfo.usedSlots,
      totalPurchasedSlots: slotInfo.totalPurchasedSlots,
      lastPurchaseDate: slotInfo.lastPurchaseDate,
      lastUsageDate: slotInfo.lastUsageDate
    }
  } catch (error) {
    console.error('Error getting realtime slot balance:', error)
    return {
      success: false,
      availableSlots: 0,
      usedSlots: 0,
      totalPurchasedSlots: 0,
      message: 'Failed to fetch slot balance'
    }
  }
}

/**
 * Add slots to coordinator balance after successful payment
 */
export async function addSlotsToCoordinator(
  coordinatorId: number,
  chapterId: number,
  slotsToAdd: number,
  paymentReference: string
) {
  try {
    const db = getDbConnection()
    
    // First check if slots have already been added for this payment reference
    const existingAddition = await db
      .select()
      .from(slotUsageHistory)
      .where(
        and(
          eq(slotUsageHistory.coordinatorId, coordinatorId),
          eq(slotUsageHistory.usageType, 'adjustment'),
          sql`${slotUsageHistory.notes} LIKE ${`%payment ${paymentReference}%`}`
        )
      )
      .limit(1)

    if (existingAddition.length > 0) {
      console.log(`⚠️ Slots already added for payment ${paymentReference}, skipping duplicate addition`)
      return
    }

    // Verify the purchase record exists and get the exact slots purchased
    const purchaseRecord = await db
      .select({
        slotsPurchased: slotPurchases.slotsPurchased,
        paymentStatus: slotPurchases.paymentStatus
      })
      .from(slotPurchases)
      .where(eq(slotPurchases.paymentReference, paymentReference))
      .limit(1)

    if (purchaseRecord.length === 0) {
      throw new Error(`Purchase record not found for reference: ${paymentReference}`)
    }

    const actualSlotsPurchased = purchaseRecord[0].slotsPurchased || 0
    
    // Ensure we only add the exact slots purchased, not what was passed in
    if (actualSlotsPurchased !== slotsToAdd) {
      console.warn(`⚠️ Mismatch: Requested to add ${slotsToAdd} slots but purchase shows ${actualSlotsPurchased} slots. Using purchase record value.`)
    }
    
    // Update coordinator slots using the exact slots from purchase record
    const result = await db
      .update(coordinatorSlots)
      .set({
        availableSlots: sql`${coordinatorSlots.availableSlots} + ${actualSlotsPurchased}`,
        totalPurchasedSlots: sql`${coordinatorSlots.totalPurchasedSlots} + ${actualSlotsPurchased}`,
        lastPurchaseDate: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(coordinatorSlots.coordinatorId, coordinatorId),
          eq(coordinatorSlots.chapterId, chapterId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Coordinator slots record not found')
    }

    // Record the slot addition in usage history for tracking
    await db
      .insert(slotUsageHistory)
      .values({
        coordinatorId,
        slotsUsed: -actualSlotsPurchased, // Negative to indicate addition
        usageType: 'adjustment',
        notes: `Added ${actualSlotsPurchased} slots via payment ${paymentReference}`,
        createdAt: new Date(),
      })

    console.log(`✅ Added exactly ${actualSlotsPurchased} slots to coordinator ${coordinatorId} for payment ${paymentReference}`)
    return result[0]
  } catch (error) {
    console.error('Error adding slots to coordinator:', error)
    throw error
  }
}
