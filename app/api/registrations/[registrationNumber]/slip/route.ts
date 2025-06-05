import { NextResponse } from "next/server"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateRegistrationSlipPDF } from "@/lib/pdf"
import { getDbConnection } from "@/db/utils"

export async function GET(request: Request, { params }: { params: { registrationNumber: string } }) {
  try {
    // Ensure params is awaited before using its properties
    const { registrationNumber } = await params
    if (!registrationNumber) {
      return NextResponse.json({ error: "Registration number is required" }, { status: 400 })
    }
    const db = getDbConnection();

    // Get registration details
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.registrationNumber, registrationNumber),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Check if payment is completed
    if (registration.paymentStatus !== "completed") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 403 })
    }

    // Ensure we have valid data for PDF generation
    const registrationData = {
      ...registration,
      paymentStatus: registration.paymentStatus || "pending" as "pending" | "completed"
    }

    // Generate PDF
    const pdfBuffer = await generateRegistrationSlipPDF(registrationData)

    // Set headers for PDF download
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="registration-slip-${registrationNumber}.pdf"`)

    // Convert Buffer to Uint8Array for compatibility with NextResponse
    return new NextResponse(Uint8Array.from(pdfBuffer), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("Error generating registration slip:", error)
    return NextResponse.json({ error: "Failed to generate registration slip" }, { status: 500 })
  }
}
