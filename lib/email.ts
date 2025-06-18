// Email Notifications
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import RegistrationConfirmationEmail from "@/emails/registration-confirmation"
import PaymentConfirmationEmail from "@/emails/payment-confirmation"
import CoordinatorNotificationEmail from "@/emails/coordinator-notification"
import CoordinatorDuplicateNotificationEmail from "@/emails/coordinator-duplicate-notification"

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

export async function sendCoordinatorDuplicateNotificationEmail(data: {
  to: string
  coordinatorName: string
  studentName: string
  registrationNumber: string
  chapterName: string
  reason: string
  adminUser: string
}) {
  const mailer = getTransporter()
  if (!mailer) {
    return { success: false, error: "Email service not available" }
  }

  try {
    const emailHtml = await render(
      CoordinatorDuplicateNotificationEmail({
        coordinatorName: data.coordinatorName,
        studentName: data.studentName,
        registrationNumber: data.registrationNumber,
        chapterName: data.chapterName,
        reason: data.reason,
        adminUser: data.adminUser,
      })
    )

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"NAPPS Nasarawa" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: `🚨 Registration Deletion Notice - ${data.registrationNumber}`,
      html: emailHtml,
    }

    const result = await mailer.sendMail(mailOptions)
    console.log("✅ Coordinator duplicate notification email sent, messageId:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Coordinator duplicate notification email error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
