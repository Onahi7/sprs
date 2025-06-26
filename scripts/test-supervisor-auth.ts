/**
 * Test script to debug supervisor login issues
 * Run this to check if supervisors exist and auth is working
 */

import { getDbConnection } from '../db/utils'
import { supervisors } from '../db/schema'
import { eq } from 'drizzle-orm'

async function testSupervisorAuth() {
  try {
    console.log('🔍 Testing supervisor authentication system...\n')

    const db = getDbConnection()

    // 1. Check if supervisors table exists and has data
    console.log('1️⃣ Checking supervisors in database...')
    const allSupervisors = await db
      .select({
        id: supervisors.id,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        schoolName: supervisors.schoolName,
        centerId: supervisors.centerId,
        chapterId: supervisors.chapterId,
        isActive: supervisors.isActive,
        pin: supervisors.pin,
        lastLogin: supervisors.lastLogin
      })
      .from(supervisors)
      .limit(10)

    if (allSupervisors.length === 0) {
      console.log('❌ No supervisors found in database!')
      console.log('💡 This is likely why login is failing.')
      console.log('\n🔧 To fix this:')
      console.log('1. Run the supervisor setup script to create supervisors')
      console.log('2. Or manually add supervisors via admin panel')
      return
    }

    console.log(`✅ Found ${allSupervisors.length} supervisor(s):`)
    allSupervisors.forEach((supervisor, index) => {
      console.log(`   ${index + 1}. ${supervisor.name}`)
      console.log(`      Phone: ${supervisor.phoneNumber}`)
      console.log(`      School: ${supervisor.schoolName || 'Not specified'}`)
      console.log(`      Center ID: ${supervisor.centerId}`)
      console.log(`      Chapter ID: ${supervisor.chapterId}`)
      console.log(`      Active: ${supervisor.isActive}`)
      console.log(`      Has PIN: ${supervisor.pin ? 'Yes' : 'No (needs setup)'}`)
      console.log(`      Last Login: ${supervisor.lastLogin || 'Never'}`)
      console.log()
    })

    // 2. Test active supervisors
    console.log('2️⃣ Checking active supervisors...')
    const activeSupervisors = await db
      .select()
      .from(supervisors)
      .where(eq(supervisors.isActive, true))

    console.log(`✅ Active supervisors: ${activeSupervisors.length}`)

    if (activeSupervisors.length === 0) {
      console.log('❌ No active supervisors found!')
      console.log('💡 All supervisors are marked as inactive.')
      return
    }

    // 3. Test sample phone number lookup
    const testPhone = activeSupervisors[0].phoneNumber
    console.log(`3️⃣ Testing phone lookup for: ${testPhone}`)
    
    const phoneTest = await db
      .select()
      .from(supervisors)
      .where(eq(supervisors.phoneNumber, testPhone))
      .limit(1)

    if (phoneTest.length > 0) {
      console.log(`✅ Phone lookup successful for ${phoneTest[0].name}`)
    } else {
      console.log('❌ Phone lookup failed')
    }

    // 4. Test API endpoint manually
    console.log('4️⃣ Testing API endpoint simulation...')
    try {
      // Simulate the first step of auth (phone number check)
      console.log(`   Testing with phone: ${testPhone}`)
      console.log('   This simulates: POST /api/supervisor/auth with { phoneNumber }')
      
      const supervisor = await db
        .select()
        .from(supervisors)
        .where(eq(supervisors.phoneNumber, testPhone))
        .limit(1)

      if (supervisor.length === 0) {
        console.log('   ❌ Supervisor not found')
      } else {
        const supervisorData = supervisor[0]
        console.log(`   ✅ Supervisor found: ${supervisorData.name}`)
        
        if (!supervisorData.pin) {
          console.log('   📝 PIN setup would be required')
        } else {
          console.log('   🔐 PIN login would be required')
        }
      }
    } catch (apiError) {
      console.log('   ❌ API simulation failed:', apiError)
    }

    console.log('\n🎯 Login Testing Instructions:')
    console.log('1. Open browser to /supervisor/login')
    console.log(`2. Enter phone number: ${testPhone}`)
    console.log('3. Check browser console for detailed logs')
    console.log('4. If stuck on loading, check network tab for failed requests')

    console.log('\n📋 Common Issues & Solutions:')
    console.log('• Loading state stuck: Check browser network tab for 500 errors')
    console.log('• "Supervisor not found": Verify phone number matches database exactly')
    console.log('• Database connection errors: Check DATABASE_URL environment variable')
    console.log('• No supervisors: Run supervisor creation script or add via admin')

  } catch (error) {
    console.error('❌ Test failed with error:', error)
    console.log('\n🔧 Debugging steps:')
    console.log('1. Check database connection')
    console.log('2. Verify supervisors table exists')
    console.log('3. Check environment variables')
    console.log('4. Look at server logs for errors')
  }
}

// Run the test
testSupervisorAuth()
  .then(() => {
    console.log('\n🏁 Supervisor auth test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error)
    process.exit(1)
  })
