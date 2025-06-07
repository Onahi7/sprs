/**
 * Paystack Configuration and Utilities
 * Handles secure payment processing with split codes
 */

// Paystack configuration
export const PAYSTACK_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  baseUrl: 'https://api.paystack.co',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
}

// Payment channels allowed
export const PAYMENT_CHANNELS = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']

// Currency
export const CURRENCY = 'NGN'

/**
 * Initialize Paystack payment with split code
 */
export async function initializePaystackPayment(data: {
  email: string
  amount: number // in kobo
  reference: string
  splitCode: string
  metadata: {
    coordinatorId: number
    chapterId: number
    slotPackageId: number
    slotsPurchased: number
    coordinatorName?: string
    chapterName?: string
    packageName?: string
  }
  callback_url?: string
  cancel_action?: string
}) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        email: data.email,
        amount: data.amount,
        reference: data.reference,
        currency: CURRENCY,
        channels: PAYMENT_CHANNELS,
        // Only include split_code if it's a valid Paystack split code (starts with SPL_)
        ...(data.splitCode && data.splitCode.startsWith('SPL_') ? { split_code: data.splitCode } : {}),
        metadata: {
          ...data.metadata,
          payment_type: 'slot_purchase',
          custom_fields: [
            {
              display_name: 'Coordinator',
              variable_name: 'coordinator_name',
              value: data.metadata.coordinatorName || 'N/A'
            },
            {
              display_name: 'Chapter',
              variable_name: 'chapter_name', 
              value: data.metadata.chapterName || 'N/A'
            },
            {
              display_name: 'Package',
              variable_name: 'package_name',
              value: data.metadata.packageName || 'N/A'
            },
            {
              display_name: 'Slots',
              variable_name: 'slots_purchased',
              value: data.metadata.slotsPurchased.toString()
            }
          ]
        },
        callback_url: data.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots/payment/callback`,
        cancel_action: data.cancel_action || `${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots?payment=cancelled`,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to initialize payment')
    }

    return {
      success: true,
      data: result.data,
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference,
    }

  } catch (error) {
    console.error('Paystack initialization error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment initialization failed',
    }
  }
}

/**
 * Verify Paystack payment
 */
export async function verifyPaystackPayment(reference: string) {
  try {
    const response = await fetch(`${PAYSTACK_CONFIG.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_CONFIG.secretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Payment verification failed')
    }

    return {
      success: true,
      data: result.data,
      status: result.data.status,
      amount: result.data.amount,
      metadata: result.data.metadata,
      customer: result.data.customer,
      split: result.data.split,
      paid_at: result.data.paid_at,
    }

  } catch (error) {
    console.error('Paystack verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    }
  }
}

/**
 * Validate Paystack webhook signature
 */
export function validatePaystackWebhook(payload: string, signature: string): boolean {
  try {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha512', PAYSTACK_CONFIG.webhookSecret)
      .update(payload, 'utf-8')
      .digest('hex')
    
    return hash === signature
  } catch (error) {
    console.error('Webhook validation error:', error)
    return false
  }
}

/**
 * Convert Naira to Kobo (Paystack expects amounts in kobo)
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString()}`
  }
  return `${amount.toLocaleString()} ${currency}`
}
