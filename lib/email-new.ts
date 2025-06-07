// Email Notifications
import { Resend } from "resend"
import { render } from "@react-email/render"
import RegistrationConfirmationEmail from "../emails/registration-confirmation"
import PaymentConfirmationEmail from "../emails/payment-confirmation"
import CoordinatorNotificationEmail from "../emails/coordinator-notification"

// Email configuration with fallbacks
// Configure Resend client
const resendApiKey = process.env.RESEND_API_KEY || ''
const resend = new Resend(resendApiKey)

// Test email connection
/**
 * Test if Resend API key is configured
 */
export async function testEmailConnection() {
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY not set' }
  }
  return { success: true, message: 'Resend client configured' }
}

export async function sendRegistrationConfirmationEmail(data: {
  to: string
  name: string
  registrationNumber: string
  chapter: string
  school: string
  center: string
}) {
  if (!resendApiKey) {
    console.error("Resend API key not set")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      RegistrationConfirmationEmail({
        name: data.name,
        registrationNumber: data.registrationNumber,
        chapter: data.chapter,
        school: data.school,
        center: data.center,
      }),
    )

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@sprs.example.com',
      to: data.to,
      subject: 'Registration Confirmation - Student Project Registration System',
      html: emailHtml,
    })

    const messageId = (result as any).id || ''
    console.log("✅ Registration confirmation email sent, id:", messageId)
    return { success: true, messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function sendPaymentConfirmationEmail(data: {
  to: string
  name: string
  registrationNumber: string
  amount: number
  paymentReference: string
}) {
  if (!resendApiKey) {
    console.error("Resend API key not set")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      PaymentConfirmationEmail({
        name: data.name,
        registrationNumber: data.registrationNumber,
        amount: data.amount,
        paymentReference: data.paymentReference,
      }),
    )

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@sprs.example.com',
      to: data.to,
      subject: 'Payment Confirmation - Student Project Registration System',
      html: emailHtml,
    })

    const messageId = (result as any).id || ''
    console.log("✅ Payment confirmation email sent, id:", messageId)
    return { success: true, messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function sendCoordinatorNotificationEmail(data: {
  to: string
  coordinatorName: string
  studentName: string
  registrationNumber: string
  chapter: string
}) {
  if (!resendApiKey) {
    console.error("Resend API key not set")
    return { success: false, error: "Email service not configured" }
  }

  try {
    const emailHtml = await render(
      CoordinatorNotificationEmail({
        coordinatorName: data.coordinatorName,
        studentName: data.studentName,
        registrationNumber: data.registrationNumber,
        chapter: data.chapter,
      }),
    )

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@sprs.example.com',
      to: data.to,
      subject: 'New Registration Notification - Student Project Registration System',
      html: emailHtml,
    })

    const messageId = (result as any).id || ''
    console.log("✅ Coordinator notification email sent, id:", messageId)
    return { success: true, messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function sendSlotPurchaseConfirmationEmail(data: {
  to: string
  coordinatorName: string
  chapterName: string
  packageName: string
  slotsPurchased: number
  amountPaid: number | string
  paymentReference: string
  transactionDate: string
  availableSlots: number
  totalSlots: number
}) {
  // Use Resend instead of nodemailer
  if (!resendApiKey) {
    console.error("Resend API key not set")
    return { success: false, error: "Email service not configured" }
  }

  try {
    // Dynamically import the slot purchase confirmation template
    const { default: SlotPurchaseConfirmationEmail } = await import("../emails/slot-purchase-confirmation")
    const emailHtml = await render(
      SlotPurchaseConfirmationEmail({
        coordinatorName: data.coordinatorName,
        coordinatorEmail: data.to,
        chapterName: data.chapterName,
        packageName: data.packageName,
        slotsPurchased: data.slotsPurchased,
        amountPaid: `₦${data.amountPaid.toLocaleString()}`,
        paymentReference: data.paymentReference,
        transactionDate: data.transactionDate,
        currentSlotBalance: data.availableSlots,
      })
    )
    // Send via Resend
    const result: any = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'no-reply@sprs.example.com',
      to: data.to,
      subject: `🎉 Slot Purchase Confirmed - ${data.slotsPurchased} slots added to your account`,
      html: emailHtml,
    })
    const messageId = (result as any).id || ''
    console.log("✅ Slot purchase confirmation email sent, id:", messageId)
    return { success: true, messageId }
  } catch (error) {
    console.error("❌ Slot purchase email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
