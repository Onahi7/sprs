import { NextResponse } from "next/server"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyPayment } from "@/lib/payment"
import { sendPaymentConfirmationEmail } from "@/lib/email"
import { getDbConnection } from "@/db/utils"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    // Verify payment
    const verificationResult = await verifyPayment(reference)

    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed", error: verificationResult.error },
        { status: 400 },
      )
    }

    // Get registration details
    const db = getDbConnection();
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.paymentReference, reference),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found for this payment" }, { status: 404 })
    }

    // Make sure the amount is a number
    const amount = registration.chapter?.amount 
      ? parseFloat(registration.chapter.amount) 
      : 3000;

    // Send payment confirmation email
    await sendPaymentConfirmationEmail({
      to: registration.parentEmail,
      name: `${registration.firstName} ${registration.lastName}`,
      registrationNumber: registration.registrationNumber,
      amount: amount,
      paymentReference: reference,
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        registrationNumber: registration.registrationNumber,
        paymentStatus: "completed",
        firstName: registration.firstName,
        middleName: registration.middleName,
        lastName: registration.lastName,
        chapterName: registration.chapter?.name,
        schoolName: registration.schoolName || registration.school?.name,
        centerName: registration.center?.name,
        paymentReference: reference,
        createdAt: registration.createdAt,
        passportUrl: registration.passportUrl,
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    
    // Log the error details
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred during payment verification"
      },
      { status: 500 },
    )
  }
}
