import { NextResponse } from "next/server"
import { testEmailConnection, sendPaymentConfirmationEmail } from "@/lib/email"

export async function GET() {
  try {
    // Test email connection
    const connectionTest = await testEmailConnection()
    
    return NextResponse.json({
      success: true,
      connection: connectionTest,
      config: {
        host: process.env.EMAIL_SERVER_HOST || process.env.EMAIL_HOST,
        port: process.env.EMAIL_SERVER_PORT || process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SERVER_SECURE || process.env.EMAIL_SECURE,
        user: process.env.EMAIL_SERVER_USER || process.env.EMAIL_USER,
        hasPassword: !!(process.env.EMAIL_SERVER_PASSWORD || process.env.EMAIL_PASSWORD),
        from: process.env.EMAIL_FROM,
      }
    })
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown email test error" 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return NextResponse.json({ error: "Test email address is required" }, { status: 400 })
    }

    // Send a test email
    const result = await sendPaymentConfirmationEmail({
      to: testEmail,
      name: "Test User",
      registrationNumber: "TEST-2025-001",
      amount: 3000,
      paymentReference: "TEST-REF-123",
    })

    return NextResponse.json({
      success: true,
      emailSent: result.success,
      message: result.success ? "Test email sent successfully!" : result.error,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error("Test email sending error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error sending test email" 
      },
      { status: 500 }
    )
  }
}
