#!/usr/bin/env npx tsx

/**
 * Debug script to check a coordinator's slot balance and transaction history
 */

import { getDbConnection } from '../db/utils'
import { coordinatorSlots, slotPurchases, slotPackages, chapterCoordinators } from '../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCoordinatorSlots, getCoordinatorPurchaseHistory } from '../db/coordinator-slots-utils'

async function debugSlotBalance(coordinatorEmail?: string) {
  console.log('🔍 Debugging Slot Balance')
  console.log('=' .repeat(60))

  const db = getDbConnection()

  try {
    // Find the coordinator by email or list all coordinators
    let coordinators = []
    
    if (coordinatorEmail) {
      coordinators = await db
        .select()
        .from(chapterCoordinators)
        .where(eq(chapterCoordinators.email, coordinatorEmail))
    } else {
      coordinators = await db
        .select()
        .from(chapterCoordinators)
        .limit(10)
    }
    
    if (coordinators.length === 0) {
      console.log('❌ No coordinators found')
      return
    }

    for (const coordinator of coordinators) {
      console.log(`\n📋 Coordinator: ${coordinator.name} (${coordinator.email})`)
      
      // Get slot balance
      const slotInfo = await getCoordinatorSlots(coordinator.id)
      
      if (slotInfo) {
        console.log('\n📊 Slot Balance:')
        console.log(`   Available: ${slotInfo.availableSlots}`)
        console.log(`   Used: ${slotInfo.usedSlots}`)
        console.log(`   Total Purchased: ${slotInfo.totalPurchasedSlots}`)
        console.log(`   Last Purchase: ${slotInfo.lastPurchaseDate}`)
        console.log(`   Last Usage: ${slotInfo.lastUsageDate}`)
      } else {
        console.log('   No slot record found')
      }
      
      // Get slot purchases
      const purchases = await db
        .select({
          id: slotPurchases.id,
          reference: slotPurchases.paymentReference,
          slotCount: slotPurchases.slotsPurchased,
          amount: slotPurchases.amountPaid,
          status: slotPurchases.paymentStatus,
          packageId: slotPurchases.slotPackageId,
          packageName: slotPackages.name,
          createdAt: slotPurchases.createdAt,
          verifiedAt: slotPurchases.paymentVerifiedAt
        })
        .from(slotPurchases)
        .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
        .where(eq(slotPurchases.coordinatorId, coordinator.id))
        .orderBy(desc(slotPurchases.createdAt))
      
      console.log('\n💳 Purchase History:')
      
      if (purchases.length === 0) {
        console.log('   No purchases found')
      } else {
        let totalSlotsPurchased = 0
        let totalCompletedSlots = 0
        
        purchases.forEach((purchase, index) => {
          console.log(`\n   ${index + 1}. [${purchase.status}] ${purchase.packageName || 'Unknown Package'}`)
          console.log(`      Slots: ${purchase.slotCount} | Amount: ₦${purchase.amount}`)
          console.log(`      Reference: ${purchase.reference}`)
          console.log(`      Created: ${purchase.createdAt}`)
          console.log(`      Verified: ${purchase.verifiedAt || 'Not verified'}`)
          
          totalSlotsPurchased += purchase.slotCount || 0
          if (purchase.status === 'completed') {
            totalCompletedSlots += purchase.slotCount || 0
          }
        })
        
        console.log('\n📝 Summary:')
        console.log(`   Total Purchases: ${purchases.length}`)
        console.log(`   Total Slots in Purchases: ${totalSlotsPurchased}`)
        console.log(`   Total Completed Slots: ${totalCompletedSlots}`)
        
        if (slotInfo) {
          console.log('\n⚠️ Balance Check:')
          console.log(`   DB Available + Used: ${slotInfo.availableSlots + slotInfo.usedSlots}`)
          console.log(`   DB Total Purchased: ${slotInfo.totalPurchasedSlots}`)
          console.log(`   Sum of Completed Purchases: ${totalCompletedSlots}`)
          
          if (slotInfo.totalPurchasedSlots !== totalCompletedSlots) {
            console.log('   ❌ DISCREPANCY DETECTED: Total purchased slots doesn\'t match completed purchases')
          } else {
            console.log('   ✅ Balance matches completed purchases')
          }
          
          if ((slotInfo.availableSlots + slotInfo.usedSlots) !== slotInfo.totalPurchasedSlots) {
            console.log('   ❌ DISCREPANCY DETECTED: Available + Used doesn\'t match Total Purchased')
          } else {
            console.log('   ✅ Available + Used = Total Purchased')
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during debug:', error)
  }
}

// Get coordinator email from command line args
const coordinatorEmail = process.argv[2]

// Run the debug function
debugSlotBalance(coordinatorEmail).catch(console.error)
