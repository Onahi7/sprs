/**
 * Test script for Resend email configuration
 * Run this to verify that your email setup is working correctly
 */

import { testEmailConfiguration, sendSlotPurchaseConfirmationEmail } from '../lib/email-resend'

async function main() {
  console.log('🧪 Testing NAPPS SPRS Email Configuration with Resend...\n')

  // Check environment variables
  console.log('1️⃣ Checking environment variables...')
  const hasResendKey = !!process.env.RESEND_API_KEY
  
  if (!hasResendKey) {
    console.log('❌ RESEND_API_KEY is not configured')
    console.log('💡 Please add RESEND_API_KEY to your .env.local file')
    console.log('💡 Get your API key from: https://resend.com/api-keys')
    return
  } else {
    console.log('✅ RESEND_API_KEY is configured')
  }

  // Test basic email configuration
  console.log('\n2️⃣ Testing basic email configuration...')
  try {
    const configTest = await testEmailConfiguration()
    if (configTest.success) {
      console.log('✅ Basic email configuration test passed')
      console.log('📧 Email ID:', configTest.data?.id)
    } else {
      console.log('❌ Basic email configuration test failed:', configTest.error)
      return
    }
  } catch (error) {
    console.log('❌ Basic email test error:', error)
    return
  }

  // Test slot purchase confirmation email
  console.log('\n3️⃣ Testing slot purchase confirmation email...')
  try {
    const testEmailResult = await sendSlotPurchaseConfirmationEmail({
      to: 'test@example.com', // Change this to your email for testing
      coordinatorName: 'Test Coordinator',
      chapterName: 'Test Chapter',
      packageName: '50 Slots Package',
      slotsPurchased: 50,
      amountPaid: '₦12,500',
      paymentReference: 'TEST_REF_123456789',
      currentSlotBalance: 100,
      transactionDate: new Date().toLocaleDateString(),
    })

    if (testEmailResult.success) {
      console.log('✅ Slot purchase confirmation email test passed')
      console.log('📧 Email ID:', testEmailResult.data?.id)
    } else {
      console.log('❌ Slot purchase confirmation email test failed:', testEmailResult.error)
    }
  } catch (error) {
    console.log('❌ Slot purchase email test error:', error)
  }

  console.log('\n✅ Email testing complete!')
  console.log('\n📋 Next steps:')
  console.log('1. Replace test@example.com with a real email address to test')
  console.log('2. Check your Resend dashboard for sent emails')
  console.log('3. Verify the domain in Resend if you want to send from a custom domain')
  console.log('4. Update the "from" email address in lib/email-resend.ts if needed')
}

// Run the test
main().catch(console.error)
