/**
 * Test script for slot purchase email functionality
 * Run this to test the email system for slot purchases
 */

import { sendSlotPurchaseConfirmationEmail, testEmailConnection } from '../lib/email-new'

async function testSlotPurchaseEmail() {
  console.log('🧪 Testing Slot Purchase Email System...\n')

  // 1. Test email connection
  console.log('1️⃣ Testing email connection...')
  const connectionTest = await testEmailConnection()
  
  if (!connectionTest.success) {
    console.error('❌ Email connection failed:', connectionTest.error)
    console.log('\n💡 Please configure your email settings in .env.local:')
    console.log('   EMAIL_SERVER_USER="your-email@gmail.com"')
    console.log('   EMAIL_SERVER_PASSWORD="your-app-password"')
    console.log('   EMAIL_FROM="NAPPS SPRS <your-email@gmail.com>"')
    return
  }
  
  console.log('✅ Email connection successful!')

  // 2. Test slot purchase confirmation email
  console.log('\n2️⃣ Testing slot purchase confirmation email...')
  
  const testEmailData = {
    to: process.env.EMAIL_SERVER_USER || 'test@example.com',
    coordinatorName: 'John Doe',
    chapterName: 'Lagos Chapter',
    packageName: '100 Slots Package',
    slotsPurchased: 100,
    amountPaid: 25000,
    paymentReference: 'SLOT_TEST_' + Date.now(),
    transactionDate: new Date().toISOString(),
    availableSlots: 150,
    totalSlots: 200,
  }

  try {
    const emailResult = await sendSlotPurchaseConfirmationEmail(testEmailData)
    
    if (emailResult.success) {
      console.log('✅ Slot purchase confirmation email sent successfully!')
      console.log('📧 Message ID:', emailResult.messageId)
      console.log('📬 Sent to:', testEmailData.to)
      console.log('\n📋 Email details:')
      console.log(`   - Coordinator: ${testEmailData.coordinatorName}`)
      console.log(`   - Chapter: ${testEmailData.chapterName}`)
      console.log(`   - Package: ${testEmailData.packageName}`)
      console.log(`   - Slots purchased: ${testEmailData.slotsPurchased}`)
      console.log(`   - Amount: ₦${testEmailData.amountPaid.toLocaleString()}`)
      console.log(`   - Reference: ${testEmailData.paymentReference}`)
      console.log(`   - Available slots: ${testEmailData.availableSlots}`)
    } else {
      console.error('❌ Failed to send slot purchase email:', emailResult.error)
    }
  } catch (error) {
    console.error('❌ Email test failed:', error)
  }

  console.log('\n🏁 Email test completed!')
}

// Run the test
if (require.main === module) {
  testSlotPurchaseEmail().catch(console.error)
}

export { testSlotPurchaseEmail }
