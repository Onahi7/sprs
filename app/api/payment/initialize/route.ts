import { NextResponse } from "next/server"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { initializePayment } from "@/lib/payment"
import { getDbConnection } from "@/db/utils"

export async function POST(request: Request) {
  try {
    const { registrationId } = await request.json()
    const db = getDbConnection();

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID is required" }, { status: 400 })
    }

    // Get registration details
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
      with: {
        chapter: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Check if payment is already completed
    if (registration.paymentStatus === "completed") {
      return NextResponse.json({ error: "Payment already completed" }, { status: 400 })
    }

    // Get payment amount from chapter
    const amount = registration.chapter?.amount 
      ? parseFloat(registration.chapter.amount) 
      : 3000 // Default to 3000 if not specified
    
    // Generate a unique reference
    const reference = `NAPPS-${registration.registrationNumber}-${Date.now()}`
    
    // Initialize payment
    const appUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const callbackUrl = `${appUrl}/payment/callback`
    
    console.log('Payment details:', {
      email: registration.parentEmail,
      amount,
      reference,
      callbackUrl,
      chapterSplitCode: registration.chapter?.splitCode,
      registrationNumber: registration.registrationNumber
    });

    // Use chapter-specific split code for normal student registration
    const paymentResult = await initializePayment({
      email: registration.parentEmail,
      amount: amount,
      reference,
      callbackUrl,
      splitCode: registration.chapter?.splitCode || undefined,
      metadata: {
        registrationId: registration.id,
        registrationNumber: registration.registrationNumber,
        studentName: `${registration.firstName} ${registration.lastName}`,
      },
    })

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error }, { status: 500 })
    }

    // Update registration with payment reference and split code used
    await db
      .update(registrations)
      .set({
        paymentReference: reference,
        splitCodeUsed: registration.chapter?.splitCode || null,
      })
      .where(eq(registrations.registrationNumber, registration.registrationNumber))

    return NextResponse.json({
      success: true,
      authorizationUrl: paymentResult.authorizationUrl,
      reference: paymentResult.reference,
    })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
