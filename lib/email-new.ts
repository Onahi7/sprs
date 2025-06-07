// Email Notifications
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import RegistrationConfirmationEmail from "../emails/registration-confirmation"
import PaymentConfirmationEmail from "../emails/payment-confirmation"
import CoordinatorNotificationEmail from "../emails/coordinator-notification"

// Email configuration with fallbacks
const emailConfig = {
  host: process.env.EMAIL_SERVER_HOST || process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SERVER_PORT || process.env.EMAIL_PORT || 587),
  secure: (process.env.EMAIL_SERVER_SECURE || process.env.EMAIL_SECURE) === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER || process.env.EMAIL_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD || process.env.EMAIL_PASSWORD,
  },
}

// Validate email configuration
function validateEmailConfig() {
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn("⚠️  Email configuration incomplete. Please set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in your .env.local file")
    return false
  }
  return true
}

// Create a transporter with error handling
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter && validateEmailConfig()) {
    try {
      // use nodemailer's createTransport
      transporter = nodemailer.createTransport(emailConfig)
      console.log("✅ Email transporter initialized successfully")
    } catch (error) {
      console.error("❌ Failed to create email transporter:", error)
      return null
    }
  }
  return transporter
}

// Test email connection
export async function testEmailConnection() {
  const mailer = getTransporter()
  if (!mailer) {
    return { success: false, error: "Email transporter not available" }
  }

  try {
    await mailer.verify()
    return { success: true, message: "Email connection verified successfully" }
  } catch (error) {
    console.error("Email connection test failed:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown email connection error" 
    }
  }
}

export async function sendRegistrationConfirmationEmail(data: {
  to: string
  name: string
  registrationNumber: string
  chapter: string
  school: string
  center: string
}) {
  const mailer = getTransporter()
  if (!mailer) {
    console.error("Email transporter not available")
    return {
      success: false,
      error: "Email service not configured",
    }
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

    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"SPRS" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: "Registration Confirmation - Student Project Registration System",
      html: emailHtml,
    })

    console.log("✅ Registration confirmation email sent:", result.messageId)
    return {
      success: true,
      messageId: result.messageId,
    }
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
  const mailer = getTransporter()
  if (!mailer) {
    console.error("Email transporter not available")
    return {
      success: false,
      error: "Email service not configured",
    }
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

    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"SPRS" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: "Payment Confirmation - Student Project Registration System",
      html: emailHtml,
    })

    console.log("✅ Payment confirmation email sent:", result.messageId)
    return {
      success: true,
      messageId: result.messageId,
    }
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
  const mailer = getTransporter()
  if (!mailer) {
    console.error("Email transporter not available")
    return {
      success: false,
      error: "Email service not configured",
    }
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

    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"SPRS" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: "New Registration Notification - Student Project Registration System",
      html: emailHtml,
    })

    console.log("✅ Coordinator notification email sent:", result.messageId)
    return {
      success: true,
      messageId: result.messageId,
    }
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
  const mailer = getTransporter()
  if (!mailer) {
    console.error("Email transporter not available")
    return {
      success: false,
      error: "Email service not configured",
    }
  }

  try {
    // Import the slot purchase confirmation email template
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
      }),
    )

    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"SPRS - Slot Purchase" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: `🎉 Slot Purchase Confirmed - ${data.slotsPurchased} slots added to your account`,
      html: emailHtml,
    })

    console.log("✅ Slot purchase confirmation email sent:", result.messageId)
    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error("❌ Slot purchase email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
