// PDF Generation
import PDFDocument from "pdfkit"
import { formatDate } from "@/lib/utils"

export async function generateRegistrationSlipPDF(registration: any) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      })

      // Buffer to store PDF data
      const buffers: Buffer[] = []
      doc.on("data", buffers.push.bind(buffers))
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      // Add content to the PDF
      // Header
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("NAPPS Nasarawa State Unified Exams 2025", { align: "center" })
        .moveDown(0.5)
        .fontSize(16)
        .text("Registration Slip", { align: "center" })
        .moveDown(0.5)

      // Registration Number
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Registration Number: ${registration.registrationNumber}`, { align: "center" })
        .moveDown(1)

      // Student Information
      doc.font("Helvetica-Bold").fontSize(14).text("Student Information")
      doc.moveDown(0.5)
      doc.font("Helvetica").fontSize(12)
      doc.text(`Name: ${registration.firstName} ${registration.middleName || ""} ${registration.lastName}`)
      doc.text(`Chapter: ${registration.chapter?.name || "N/A"}`)
      doc.text(`School: ${registration.schoolName || registration.school?.name || "N/A"}`)
      doc.text(`Exam Center: ${registration.center?.name || "N/A"}`)
      doc.moveDown(1)

      // Parent Information
      doc.font("Helvetica-Bold").fontSize(14).text("Parent/Guardian Information")
      doc.moveDown(0.5)
      doc.font("Helvetica").fontSize(12)
      doc.text(`Name: ${registration.parentFirstName} ${registration.parentLastName}`)
      doc.text(`Phone: ${registration.parentPhone}`)
      doc.text(`Email: ${registration.parentEmail}`)
      doc.moveDown(1)

      // Payment Information
      doc.font("Helvetica-Bold").fontSize(14).text("Payment Information")
      doc.moveDown(0.5)
      doc.font("Helvetica").fontSize(12)
      doc.text(`Status: ${registration.paymentStatus === "completed" ? "Paid" : "Pending"}`)
      if (registration.paymentReference) {
        doc.text(`Reference: ${registration.paymentReference}`)
      }
      doc.text(`Registration Date: ${formatDate(registration.createdAt)}`)
      doc.moveDown(1)

      // Footer
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .text("Please bring this registration slip and a valid ID to the exam center on the day of the project.", {
          align: "center",
        })
        .moveDown(0.5)
        .text("This slip serves as proof of registration. Keep it safe.", { align: "center" })

      // Finalize the PDF
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
