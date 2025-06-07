import { NextRequest, NextResponse } from "next/server"
import { verifyPaystackPayment, koboToNaira } from "@/lib/paystack"
import {
  updateSlotPurchaseStatus,
  initializeCoordinatorSlots,
  getCoordinatorSlots,
} from "@/db/coordinator-slots-utils"
import { getDbConnection } from "@/db/utils"
import { slotPurchases, chapterCoordinators, chapters, slotPackages, coordinatorSlots } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendSlotPurchaseConfirmationEmail } from "@/lib/email-resend"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    console.log('🔍 Verifying payment:', reference)

    // 1. Verify payment with Paystack
    const verification = await verifyPaystackPayment(reference)
    
    console.log('📊 Paystack verification result:', {
      success: verification.success, 
      status: verification.data?.status,
      error: verification.error
    })
    
    if (!verification.success) {
      console.error('❌ Paystack verification failed:', verification.error)
      return NextResponse.json(
        { error: `Payment verification failed: ${verification.error}` },
        { status: 400 }
      )
    }

    const paymentData = verification.data
    console.log('📊 Payment status:', paymentData.status)

    // 2. Get purchase record from database
    const dbConn = getDbConnection()
    // Use dbConn for queries
    const purchaseRecord = await dbConn
      .select({
        purchase: slotPurchases,
        coordinatorName: chapterCoordinators.name,
        coordinatorEmail: chapterCoordinators.email,
        chapterName: chapters.name,
        packageName: slotPackages.name,
      })
      .from(slotPurchases)
      .leftJoin(chapterCoordinators, eq(slotPurchases.coordinatorId, chapterCoordinators.id))
      .leftJoin(chapters, eq(slotPurchases.chapterId, chapters.id))
      .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
      .where(eq(slotPurchases.paymentReference, reference))
      .limit(1)

    if (purchaseRecord.length === 0) {
      console.error('❌ Purchase record not found for reference:', reference)
      return NextResponse.json(
        { error: "Purchase record not found" },
        { status: 404 }
      )
    }

    const { purchase, coordinatorName, coordinatorEmail, chapterName, packageName } = purchaseRecord[0]

    // 3. Check if payment was successful
    if (paymentData.status === 'success') {
      console.log('✅ Payment successful, processing...')

      // 4. Update purchase status
      await updateSlotPurchaseStatus(
        reference,
        'completed',
        paymentData.id?.toString()
      )

      console.log('📝 Updated purchase status to completed')

      // 5. Initialize coordinator slots if needed
      try {
        await initializeCoordinatorSlots(purchase.coordinatorId!, purchase.chapterId!)
      } catch (error) {
        // Slots record might already exist, continue
        console.log('📋 Coordinator slots already initialized')
      }      // 6. Add slots to coordinator balance
      try {
        // Fetch existing slot info
        const slotInfo = await getCoordinatorSlots(purchase.coordinatorId!)
        const prevAvailable = slotInfo?.availableSlots || 0
        const prevTotal = slotInfo?.totalPurchasedSlots || 0
        await dbConn
          .update(coordinatorSlots)
          .set({
            availableSlots: prevAvailable + purchase.slotsPurchased!,
            totalPurchasedSlots: prevTotal + purchase.slotsPurchased!,
            lastPurchaseDate: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(coordinatorSlots.coordinatorId, purchase.coordinatorId!),
              eq(coordinatorSlots.chapterId, purchase.chapterId!)
            )
          )
      } catch (error) {
        console.error('Failed to add slots to coordinator slots table:', error)
      }

      console.log(`🎯 Added ${purchase.slotsPurchased} slots to coordinator ${purchase.coordinatorId}`)

      // 7. Get updated slot balance for email
      let currentSlotBalance = 0
      try {
        const slots = await getCoordinatorSlots(purchase.coordinatorId!)
        currentSlotBalance = slots?.availableSlots || 0
      } catch (error) {
        console.warn('⚠️ Could not fetch updated slot balance for email')
      }      // 8. Send slot purchase confirmation email
      try {
        // Get updated slot info for email
        const updatedSlots = await getCoordinatorSlots(purchase.coordinatorId!)
        
        await sendSlotPurchaseConfirmationEmail({
          to: coordinatorEmail ?? '',
          coordinatorName: coordinatorName ?? '',
          chapterName: chapterName || 'Your Chapter',
          packageName: packageName || 'Slot Package',
          slotsPurchased: purchase.slotsPurchased!,
          amountPaid: `₦${koboToNaira(paymentData.amount).toLocaleString()}`,
          paymentReference: reference,
          transactionDate: paymentData.paid_at || new Date().toISOString(),
          currentSlotBalance: updatedSlots?.availableSlots || 0,
        })
        console.log('📧 Slot purchase confirmation email sent')
      } catch (emailError) {
        console.error('📧 Email send failed:', emailError)
        // Don't fail the transaction if email fails
      }return NextResponse.json({
        success: true,
        status: 'success',
        message: `Payment successful! ${purchase.slotsPurchased} slots have been added to your account.`,
        reference: reference,
        amount: paymentData.amount,
        slotsPurchased: purchase.slotsPurchased,
        packageName: packageName,
        transactionDate: paymentData.paid_at,
        customerEmail: coordinatorEmail,
      })

    } else if (paymentData.status === 'failed') {
      console.log('❌ Payment failed')
        // Update purchase status to failed
      await updateSlotPurchaseStatus(reference, 'failed', paymentData.id?.toString())

      return NextResponse.json({
        success: false,
        status: 'failed',
        message: "Payment failed. Please try again or contact support.",
        reference: reference,
      })

    } else {
      console.log('⏳ Payment still pending')
        return NextResponse.json({
        success: false,
        status: 'pending',
        message: "Payment is still being processed. Please wait a moment and check again.",
        reference: reference,
      })
    }

  } catch (error) {
    console.error('💥 Payment verification error:', error)
    return NextResponse.json(
      { 
        error: "Payment verification failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
