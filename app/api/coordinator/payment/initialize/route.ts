import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateSlotPurchase, createSlotPurchase } from "@/db/coordinator-slots-utils";
import { initializePaystackPayment, nairaToKobo, formatCurrency } from "@/lib/paystack";
import { getDbConnection } from "@/db/utils";
import { chapterCoordinators, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { slotPackageId } = body

    console.log('🚀 Initializing payment for coordinator:', session.id)

    // 1. Validate the purchase
    const validation = await validateSlotPurchase({
      coordinatorId: session.id!,
      chapterId: session.chapterId!,
      slotPackageId: parseInt(slotPackageId)
    })

    if (!validation.valid) {
      console.error('❌ Purchase validation failed:', validation.error)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { package: pkg, splitCode, coordinator } = validation

    // 2. Get coordinator and chapter details for metadata
    const dbConn = getDbConnection()
    const coordinatorDetails = await dbConn
      .select({
        coordinatorName: chapterCoordinators.name,
        coordinatorEmail: chapterCoordinators.email,
        chapterName: chapters.name,
      })
      .from(chapterCoordinators)
      .leftJoin(chapters, eq(chapterCoordinators.chapterId, chapters.id))
      .where(eq(chapterCoordinators.id, session.id!))
      .limit(1)

    const coordinatorInfo = coordinatorDetails[0]
    if (!coordinatorInfo) {
      return NextResponse.json(
        { error: "Coordinator information not found" },
        { status: 404 }
      )
    }

    // 3. Generate unique payment reference
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9).toUpperCase()
    const paymentReference = `SLOT_${session.chapterId!}_${session.id!}_${timestamp}_${randomId}`

    // 4. Create purchase record in database
    const purchase = await createSlotPurchase({
      coordinatorId: session.id!,
      chapterId: session.chapterId!,
      slotPackageId: parseInt(slotPackageId),
      slotsPurchased: pkg!.slotCount,
      amountPaid: pkg!.price,
      paymentReference,
      splitCodeUsed: splitCode!
    })

    console.log('📝 Created purchase record:', purchase.id)

    // 5. Initialize Paystack payment
    const amountInKobo = nairaToKobo(parseFloat(pkg!.price))
    
    const paymentInit = await initializePaystackPayment({
      email: coordinatorInfo.coordinatorEmail,
      amount: amountInKobo,
      reference: paymentReference,
      splitCode: splitCode!,
      metadata: {
        coordinatorId: session.id!,
        chapterId: session.chapterId!,
        slotPackageId: parseInt(slotPackageId),
        slotsPurchased: pkg!.slotCount,
        coordinatorName: coordinatorInfo.coordinatorName,
        chapterName: coordinatorInfo.chapterName || undefined,
        packageName: pkg!.name,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots/payment/callback?ref=${paymentReference}`,
      cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/coordinator/slots?payment=cancelled&ref=${paymentReference}`,
    })

    if (!paymentInit.success) {
      console.error('❌ Paystack initialization failed:', paymentInit.error)
      return NextResponse.json(
        { error: `Payment initialization failed: ${paymentInit.error}` },
        { status: 500 }
      )
    }

    console.log('✅ Payment initialized successfully:', paymentInit.authorization_url)

    // 6. Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        authorization_url: paymentInit.authorization_url,
        access_code: paymentInit.access_code,
        reference: paymentReference,
      },
      purchase: {
        id: purchase.id,
        amount: formatCurrency(parseFloat(pkg!.price)),
        amountInKobo,
        slots: pkg!.slotCount,
        packageName: pkg!.name,
      },
      coordinator: {
        name: coordinatorInfo.coordinatorName,
        email: coordinatorInfo.coordinatorEmail,
        chapter: coordinatorInfo.chapterName,
      }
    });

  } catch (error) {
    console.error('💥 Payment initialization error:', error)
    return NextResponse.json(
      { 
        error: "Payment initialization failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
