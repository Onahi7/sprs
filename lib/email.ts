// Email Notifications
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import RegistrationConfirmationEmail from "@/emails/registration-confirmation"
import PaymentConfirmationEmail from "@/emails/payment-confirmation"
import CoordinatorNotificationEmail from "@/emails/coordinator-notification"

// Create a transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendRegistrationConfirmationEmail(data: {
  to: string
  name: string
  registrationNumber: string
  chapter: string
  school: string
  center: string
}) {
  try {
    const emailHtml = render(
      RegistrationConfirmationEmail({
        name: data.name,
        registrationNumber: data.registrationNumber,
        chapter: data.chapter,
        school: data.school,
        center: data.center,
      }),
    )

    const result = await transporter.sendMail({
      from: `"SPRS" <${process.env.EMAIL_FROM}>`,
      to: data.to,
      subject: "Registration Confirmation - Student Project Registration System",
      html: emailHtml,
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error("Email sending error:", error)
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
  try {
    const emailHtml = render(
      PaymentConfirmationEmail({
        name: data.name,
        registrationNumber: data.registrationNumber,
        amount: data.amount,
        paymentReference: data.paymentReference,
      }),
    )

    const result = await transporter.sendMail({
      from: `"SPRS" <${process.env.EMAIL_FROM}>`,
      to: data.to,
      subject: "Payment Confirmation - Student Project Registration System",
      html: emailHtml,
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error("Email sending error:", error)
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
  try {
    const emailHtml = render(
      CoordinatorNotificationEmail({
        coordinatorName: data.coordinatorName,
        studentName: data.studentName,
        registrationNumber: data.registrationNumber,
        chapter: data.chapter,
      }),
    )

    const result = await transporter.sendMail({
      from: `"SPRS" <${process.env.EMAIL_FROM}>`,
      to: data.to,
      subject: "New Registration Notification - Student Project Registration System",
      html: emailHtml,
    })

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
