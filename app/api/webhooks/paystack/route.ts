import { NextRequest, NextResponse } from "next/server"
import { validatePaystackWebhook, koboToNaira } from "@/lib/paystack"
import { 
  updateSlotPurchaseStatus,
  addSlotsToCoordinator,
  initializeCoordinatorSlots
} from "@/db/coordinator-slots-utils"
import { getDbConnection } from "@/db/utils"
import { slotPurchases } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature validation
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('❌ Missing Paystack signature')
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Validate webhook signature
    const isValidSignature = validatePaystackWebhook(body, signature)
    if (!isValidSignature) {
      console.error('❌ Invalid Paystack signature')
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const webhookData = JSON.parse(body)
    const { event, data } = webhookData

    console.log(`🔔 Paystack webhook received: ${event}`)

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data)
        break
        
      case 'charge.failed':
        await handleFailedPayment(data)
        break
        
      case 'transfer.success':
        console.log('💰 Transfer successful:', data.reference)
        break
        
      case 'transfer.failed':
        console.log('❌ Transfer failed:', data.reference)
        break
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(data: any) {
  try {
    const reference = data.reference
    console.log('✅ Processing successful payment:', reference)

    // Check if this is a slot purchase
    const metadata = data.metadata
    if (metadata?.payment_type !== 'slot_purchase') {
      console.log('ℹ️ Not a slot purchase, skipping')
      return
    }    // Get purchase record
    const db = getDbConnection()
    const purchaseRecord = await db
      .select()
      .from(slotPurchases)
      .where(eq(slotPurchases.paymentReference, reference))
      .limit(1)

    if (purchaseRecord.length === 0) {
      console.error('❌ Purchase record not found for reference:', reference)
      return
    }

    const purchase = purchaseRecord[0]

    // Check if already processed
    if (purchase.paymentStatus === 'completed') {
      console.log('ℹ️ Payment already processed')
      return
    }

    // Update purchase status
    await updateSlotPurchaseStatus(
      reference,
      'completed',
      data.id?.toString()
    )

    // Initialize coordinator slots if needed
    try {
      await initializeCoordinatorSlots(purchase.coordinatorId!, purchase.chapterId!)
    } catch (error) {
      // Slots record might already exist, continue
      console.log('📋 Coordinator slots already initialized')
    }

    // Add slots to coordinator balance
    await addSlotsToCoordinator(
      purchase.coordinatorId!,
      purchase.chapterId!,
      purchase.slotsPurchased!,
      reference
    )

    console.log(`🎯 Added ${purchase.slotsPurchased} slots to coordinator ${purchase.coordinatorId}`)

    // TODO: Send confirmation email
    console.log('📧 Sending confirmation email...')

  } catch (error) {
    console.error('💥 Error handling successful payment:', error)
  }
}

async function handleFailedPayment(data: any) {
  try {
    const reference = data.reference
    console.log('❌ Processing failed payment:', reference)

    // Update purchase status to failed
    await updateSlotPurchaseStatus(
      reference,
      'failed',
      data.id?.toString()
    )

    console.log('📝 Updated purchase status to failed')

    // TODO: Send failure notification email
    console.log('📧 Sending failure notification...')

  } catch (error) {
    console.error('💥 Error handling failed payment:', error)
  }
}
