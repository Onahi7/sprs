/**
 * Email utilities using Resend
 * Handles sending emails for slot purchases and other notifications
 */

import { Resend } from 'resend'
import { SlotPurchaseConfirmationEmail } from '@/emails/slot-purchase-confirmation'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

export interface SlotPurchaseEmailData {
  to: string
  coordinatorName: string
  chapterName: string
  packageName: string
  slotsPurchased: number
  amountPaid: string
  paymentReference: string
  currentSlotBalance: number
  transactionDate: string
}

/**
 * Send slot purchase confirmation email
 */
export async function sendSlotPurchaseConfirmationEmail(data: SlotPurchaseEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    console.log('📧 Sending slot purchase confirmation email to:', data.to)

    const result = await resend.emails.send({
      from: 'NAPPS SPRS <noreply@napps.org.ng>',
      to: [data.to],
      subject: `Slot Purchase Confirmation - ${data.slotsPurchased} Slots Added`,
      react: SlotPurchaseConfirmationEmail({
        coordinatorName: data.coordinatorName,
        chapterName: data.chapterName,
        packageName: data.packageName,
        slotsPurchased: data.slotsPurchased,
        amountPaid: data.amountPaid,
        paymentReference: data.paymentReference,
        currentSlotBalance: data.currentSlotBalance,
        transactionDate: data.transactionDate,
      }),
    })

    console.log('📧 Email sent successfully:', result.data?.id)
    return { success: true, data: result.data }

  } catch (error) {
    console.error('📧 Failed to send slot purchase email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

/**
 * Send general payment confirmation email (for compatibility)
 */
export async function sendPaymentConfirmationEmail(data: {
  to: string
  name: string
  registrationNumber: string
  amount: number
  paymentReference: string
}) {
  // For now, redirect to slot purchase email with default values
  return sendSlotPurchaseConfirmationEmail({
    to: data.to,
    coordinatorName: data.name,
    chapterName: 'N/A',
    packageName: 'Slot Package',
    slotsPurchased: 1,
    amountPaid: `₦${data.amount.toLocaleString()}`,
    paymentReference: data.paymentReference,
    currentSlotBalance: 0,
    transactionDate: new Date().toLocaleDateString(),
  })
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    // Test with a simple email
    const result = await resend.emails.send({
      from: 'NAPPS SPRS <noreply@napps.org.ng>',
      to: ['test@example.com'],
      subject: 'NAPPS SPRS Email Test',
      html: '<p>This is a test email from NAPPS SPRS system.</p>',
    })

    return { success: true, data: result.data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
