import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { verifyPaystackPayment } from "@/lib/paystack"
import { updateSlotPurchaseStatus, getCoordinatorSlots, initializeCoordinatorSlots, addSlotsToCoordinator } from "@/db/coordinator-slots-utils"
import { getDbConnection } from "@/db/utils"
import { slotPurchases, coordinatorSlots } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    console.log('🔍 Querying Paystack for reference:', reference)

    // Query Paystack directly for transaction status
    const verification = await verifyPaystackPayment(reference)
    
    if (!verification.success) {
      console.error('❌ Paystack query failed:', verification.error)
      return NextResponse.json({
        success: false,
        error: verification.error,
        reference
      }, { status: 400 })
    }    const paymentData = verification.data
    console.log('📊 Paystack response:', {
      reference,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      paid_at: paymentData.paid_at,
      channel: paymentData.channel,
      gateway_response: paymentData.gateway_response
    })

    // Check if payment was successful according to Paystack
    const isSuccessful = paymentData.status === 'success' && 
                          paymentData.gateway_response?.toLowerCase().includes('approved');
    
    let statusUpdated = false;
    let slotsAdded = false;
      if (isSuccessful) {
      try {
        // 1. First check if our database still has this as pending
        const db = getDbConnection();
        const purchaseRecord = await db
          .select()
          .from(slotPurchases)
          .where(eq(slotPurchases.paymentReference, reference))
          .limit(1);

        if (purchaseRecord.length > 0 && purchaseRecord[0].paymentStatus === 'pending') {
          console.log('🔄 Found pending transaction that Paystack shows as successful, updating status...');
          
          // Update status to completed
          await updateSlotPurchaseStatus(
            reference,
            'completed',
            paymentData.id?.toString()
          );
          statusUpdated = true;

          // Add slots using the robust function that prevents duplicates
          const purchase = purchaseRecord[0];
          try {
            await initializeCoordinatorSlots(purchase.coordinatorId!, purchase.chapterId!);
          } catch (error) {
            console.log('📋 Coordinator slots already initialized');
          }          // Use the same robust slot addition function
          await addSlotsToCoordinator(
            purchase.coordinatorId!,
            purchase.chapterId!,
            purchase.slotsPurchased!,
            reference
          );
          slotsAdded = true;
        }
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
      }
    }

    return NextResponse.json({
      success: true,
      reference,
      status_updated: statusUpdated,
      slots_added: slotsAdded,
      paystack_data: {
        status: paymentData.status,
        amount: paymentData.amount,        currency: paymentData.currency,
        paid_at: paymentData.paid_at,
        channel: paymentData.channel,
        gateway_response: paymentData.gateway_response,
        customer: paymentData.customer,
        transaction_date: paymentData.transaction_date,
        created_at: paymentData.created_at
      },
      verification_result: isSuccessful ? 'PAYMENT_SUCCESSFUL' : 'PAYMENT_NOT_SUCCESSFUL'
    })

  } catch (error) {
    console.error('❌ Error querying Paystack:', error)
    return NextResponse.json({
      success: false,
      error: "Failed to query Paystack API",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
