/**
 * Test script to verify coordinator registration flow
 * Run this to test the complete candidate registration process
 */

import { getDbConnection } from '../db/utils'
import { coordinators, coordinatorSlots, registrations } from '../db/schema'
import { eq } from 'drizzle-orm'
import { 
  validateCoordinatorRegistration, 
  useCoordinatorSlots,
  getRealtimeSlotBalance 
} from '../db/coordinator-slots-utils'

async function testCoordinatorRegistration() {
  try {
    console.log('🧪 Testing Coordinator Registration Flow\n')

    const db = getDbConnection()

    // Find a coordinator with slots
    const coordinatorWithSlots = await db
      .select({
        coordinatorId: coordinatorSlots.coordinatorId,
        email: coordinators.email,
        availableSlots: coordinatorSlots.availableSlots,
        totalPurchased: coordinatorSlots.totalPurchasedSlots
      })
      .from(coordinatorSlots)
      .innerJoin(coordinators, eq(coordinators.id, coordinatorSlots.coordinatorId))
      .where(eq(coordinatorSlots.availableSlots, 0)) // Find coordinator with slots
      .limit(1)

    if (coordinatorWithSlots.length === 0) {
      console.log('❌ No coordinators found with available slots')
      console.log('💡 Run slot purchase test first or manually add slots to a coordinator')
      return
    }

    const coordinator = coordinatorWithSlots[0]
    console.log(`📋 Testing with coordinator: ${coordinator.email}`)
    console.log(`💰 Available slots: ${coordinator.availableSlots}`)
    console.log(`📊 Total purchased: ${coordinator.totalPurchased}\n`)

    // Step 1: Validate registration
    console.log('1️⃣ Validating slot availability...')
    const validation = await validateCoordinatorRegistration(coordinator.coordinatorId, 1)
    console.log(`   Result: ${validation.canRegister ? '✅ Can register' : '❌ Cannot register'}`)
    console.log(`   Message: ${validation.message}\n`)

    if (!validation.canRegister) {
      console.log('❌ Test failed: Coordinator cannot register candidates')
      return
    }

    // Step 2: Get initial balance
    console.log('2️⃣ Getting initial slot balance...')
    const initialBalance = await getRealtimeSlotBalance(coordinator.coordinatorId)
    if (initialBalance.success) {
      console.log(`   Available: ${initialBalance.availableSlots}`)
      console.log(`   Used: ${initialBalance.usedSlots}`)
      console.log(`   Total: ${initialBalance.totalPurchasedSlots}\n`)
    }

    // Step 3: Simulate registration creation (we'll use a dummy registration ID)
    console.log('3️⃣ Simulating slot usage for registration...')
    const dummyRegistrationId = 999999 // This would be the actual registration ID in real flow
    
    const slotUsage = await useCoordinatorSlots(
      coordinator.coordinatorId,
      dummyRegistrationId,
      1,
      'registration',
      'Test registration via coordinator dashboard'
    )

    console.log(`   Result: ${slotUsage.success ? '✅ Slot used successfully' : '❌ Failed to use slot'}`)
    console.log(`   Message: ${slotUsage.message}`)
    if (slotUsage.remainingSlots !== undefined) {
      console.log(`   Remaining slots: ${slotUsage.remainingSlots}`)
    }
    console.log()

    // Step 4: Get updated balance
    console.log('4️⃣ Getting updated slot balance...')
    const updatedBalance = await getRealtimeSlotBalance(coordinator.coordinatorId)
    if (updatedBalance.success) {
      console.log(`   Available: ${updatedBalance.availableSlots} (was ${initialBalance.availableSlots})`)
      console.log(`   Used: ${updatedBalance.usedSlots} (was ${initialBalance.usedSlots})`)
      console.log(`   Total: ${updatedBalance.totalPurchasedSlots}\n`)
    }

    // Step 5: Verify changes
    const slotChange = initialBalance.success && updatedBalance.success 
      ? initialBalance.availableSlots - updatedBalance.availableSlots 
      : 0

    if (slotChange === 1) {
      console.log('✅ SUCCESS: Slot deduction working correctly!')
      console.log('✅ Coordinators can register candidates using purchased slots')
    } else {
      console.log('❌ ERROR: Slot deduction not working as expected')
      console.log(`   Expected change: 1, Actual change: ${slotChange}`)
    }

    console.log('\n📚 HOW TO REGISTER CANDIDATES:')
    console.log('1. Coordinator logs in to dashboard')
    console.log('2. Visits /coordinator/register')
    console.log('3. Fills out 4-step registration form:')
    console.log('   - Student Information (name, etc.)')
    console.log('   - School & Center Selection')
    console.log('   - Parent/Guardian Information')
    console.log('   - Passport Upload')
    console.log('4. System validates slot availability')
    console.log('5. Registration is created and 1 slot is deducted')
    console.log('6. Confirmation email sent to parent')
    console.log('7. Registration slip downloaded automatically')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testCoordinatorRegistration()
  .then(() => {
    console.log('\n🏁 Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error)
    process.exit(1)
  })
