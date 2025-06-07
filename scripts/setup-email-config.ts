/**
 * Email Setup Guide and Configuration Helper
 * This script helps you configure email settings for slot purchase notifications
 */

import { testEmailConnection } from '../lib/email-new'
import fs from 'fs'
import path from 'path'

async function setupEmailConfiguration() {
  console.log('📧 SPRS Email Configuration Setup\n')
  console.log('This script will help you configure email settings for slot purchase notifications.\n')

  // 1. Check current configuration
  console.log('1️⃣ Checking current email configuration...')
  
  const requiredEnvVars = [
    'EMAIL_SERVER_USER',
    'EMAIL_SERVER_PASSWORD',
    'EMAIL_FROM'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName] === 'your-email@gmail.com')
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing or placeholder email configuration:')
    missingVars.forEach(varName => {
      console.log(`   - ${varName}: ${process.env[varName] || 'Not set'}`)
    })
    console.log('\n📝 Please update your .env.local file with the following:')
    
    console.log('\n# Email configuration for notifications (SMTP)')
    console.log('EMAIL_SERVER_HOST="smtp.gmail.com"')
    console.log('EMAIL_SERVER_PORT="587"')
    console.log('EMAIL_SERVER_SECURE="false"')
    console.log('EMAIL_SERVER_USER="your-actual-email@gmail.com"')
    console.log('EMAIL_SERVER_PASSWORD="your-gmail-app-password"')
    console.log('EMAIL_FROM="NAPPS SPRS <your-actual-email@gmail.com>"')
    
    console.log('\n📚 Email Provider Setup Instructions:')
    console.log('\n🔸 For Gmail:')
    console.log('   1. Enable 2-factor authentication on your Gmail account')
    console.log('   2. Generate an App Password: https://myaccount.google.com/apppasswords')
    console.log('   3. Use the App Password (not your regular password) in EMAIL_SERVER_PASSWORD')
    
    console.log('\n🔸 For Outlook/Hotmail:')
    console.log('   EMAIL_SERVER_HOST="smtp-mail.outlook.com"')
    console.log('   EMAIL_SERVER_PORT="587"')
    console.log('   Use your regular Outlook password')
    
    console.log('\n🔸 For Yahoo:')
    console.log('   EMAIL_SERVER_HOST="smtp.mail.yahoo.com"')
    console.log('   EMAIL_SERVER_PORT="587"')
    console.log('   Use an App Password: https://help.yahoo.com/kb/generate-manage-third-party-passwords-sln15241.html')
    
    return false
  }

  console.log('✅ Email configuration found!')
  console.log(`   - Host: ${process.env.EMAIL_SERVER_HOST}`)
  console.log(`   - Port: ${process.env.EMAIL_SERVER_PORT}`)
  console.log(`   - User: ${process.env.EMAIL_SERVER_USER}`)
  console.log(`   - From: ${process.env.EMAIL_FROM}`)

  // 2. Test email connection
  console.log('\n2️⃣ Testing email connection...')
  
  const connectionTest = await testEmailConnection()
  
  if (!connectionTest.success) {
    console.error('❌ Email connection failed:', connectionTest.error)
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   - Verify your email credentials are correct')
    console.log('   - For Gmail, ensure you\'re using an App Password, not your regular password')
    console.log('   - Check if 2-factor authentication is enabled (required for Gmail)')
    console.log('   - Verify the SMTP host and port are correct for your email provider')
    console.log('   - Check your firewall/network settings')
    return false
  }
  
  console.log('✅ Email connection successful!')

  // 3. Show summary
  console.log('\n🎉 Email configuration is ready!')
  console.log('\n📋 What happens when a coordinator purchases slots:')
  console.log('   1. Payment is processed via Paystack')
  console.log('   2. Slots are added to coordinator\'s account')
  console.log('   3. Confirmation email is sent with:')
  console.log('      - Transaction details')
  console.log('      - Number of slots purchased')
  console.log('      - Updated slot balance')
  console.log('      - Payment reference')
  console.log('      - Chapter and package information')

  console.log('\n✨ You can test the email system by running:')
  console.log('   npx ts-node scripts/test-slot-email.ts')

  return true
}

// Run the setup
if (require.main === module) {
  setupEmailConfiguration().catch(console.error)
}

export { setupEmailConfiguration }
