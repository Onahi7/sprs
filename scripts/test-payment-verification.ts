#!/usr/bin/env npx tsx

/**
 * Test script to verify and update payment status for pending transactions
 */

import { getDbConnection } from '../db/utils'
import { slotPurchases } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyPaystackPayment } from '../lib/paystack'
import { updateSlotPurchaseStatus, initializeCoordinatorSlots, getCoordinatorSlots } from '../db/coordinator-slots-utils'

async function testPaymentVerification() {
  console.log('🧪 Testing Payment Verification for Pending Transactions')
  console.log('=' .repeat(60))

  const db = getDbConnection()

  try {
    // Find pending transactions
    const pendingTransactions = await db
      .select()
      .from(slotPurchases)
      .where(eq(slotPurchases.paymentStatus, 'pending'))
    
    console.log(`📋 Found ${pendingTransactions.length} pending transactions`)
    
    if (pendingTransactions.length === 0) {
      console.log('No pending transactions to verify')
      return
    }

    // Verify each transaction with Paystack
    for (const transaction of pendingTransactions) {
      console.log(`\n🔍 Verifying transaction: ${transaction.paymentReference}`)
      
      try {
        // Query Paystack
        console.log('   Querying Paystack...')
        const verification = await verifyPaystackPayment(transaction.paymentReference!)
        
        if (!verification.success) {
          console.log(`   ❌ Paystack verification failed: ${verification.error}`)
          continue
        }

        const paymentData = verification.data
        console.log('   📊 Paystack response:', {
          reference: transaction.paymentReference,
          status: paymentData.status,
          amount: paymentData.amount,
          gateway_response: paymentData.gateway_response
        })

        // Check if payment was successful according to Paystack
        const isSuccessful = paymentData.status === 'success' && 
                             paymentData.gateway_response?.toLowerCase().includes('approved')
        
        if (isSuccessful) {
          console.log('   ✅ Payment is successful according to Paystack, updating status...')
          
          // Update purchase status
          await updateSlotPurchaseStatus(
            transaction.paymentReference!,
            'completed',
            paymentData.id?.toString()
          )
          
          console.log('   ✅ Status updated to completed')
          
          // Add slots to coordinator balance
          try {
            // Initialize slots if needed
            await initializeCoordinatorSlots(transaction.coordinatorId!, transaction.chapterId!)
            
            // Get current slot info
            const slotInfo = await getCoordinatorSlots(transaction.coordinatorId!)
            
            if (slotInfo) {
              console.log('   📊 Current slot balance:', {
                availableSlots: slotInfo.availableSlots,
                usedSlots: slotInfo.usedSlots,
                totalPurchasedSlots: slotInfo.totalPurchasedSlots
              })
              
              // Add slots logic would go here (already handled by updateSlotPurchaseStatus)
              console.log(`   ✅ Slots would be added: ${transaction.slotsPurchased}`)
            }
          } catch (error) {
            console.error('   ❌ Error processing slots:', error)
          }
        } else {
          console.log('   ⚠️ Payment is NOT successful according to Paystack')
        }
      } catch (error) {
        console.error('   ❌ Error verifying payment:', error)
      }
    }

    console.log('\n📝 Summary:')
    console.log('   • Payment verification process tested')
    console.log('   • Check logs above for results')
    console.log('   • To fix stuck transactions, use the query feature in the UI')

  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

// Run the test
testPaymentVerification().catch(console.error)
