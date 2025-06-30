import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateRegistrationSlipPDF } from "@/lib/pdf"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = getDbConnection()
    const registrationId = parseInt(params.id)

    // Get registration with all related data
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    if (registration.paymentStatus !== "completed") {
      return NextResponse.json({ error: "Registration slip only available for completed payments" }, { status: 400 })
    }

    // Update download count
    await db
      .update(registrations)
      .set({ 
        registrationSlipDownloaded: true,
        registrationSlipDownloadCount: (registration.registrationSlipDownloadCount || 0) + 1
      })
      .where(eq(registrations.id, registrationId))

    // Generate PDF - pass the full registration object that matches RegistrationData interface
    const pdfBuffer = await generateRegistrationSlipPDF({
      id: registration.id,
      registrationNumber: registration.registrationNumber,
      firstName: registration.firstName,
      middleName: registration.middleName,
      lastName: registration.lastName,
      chapterId: registration.chapterId,
      schoolId: registration.schoolId,
      schoolName: registration.schoolName,
      centerId: registration.centerId,
      parentFirstName: registration.parentFirstName,
      parentLastName: registration.parentLastName,
      parentPhone: registration.parentPhone,
      parentEmail: registration.parentEmail,
      parentConsent: registration.parentConsent,
      passportUrl: registration.passportUrl,
      paymentStatus: registration.paymentStatus,
      paymentReference: registration.paymentReference,
      createdAt: registration.createdAt,
      chapter: registration.chapter,
      school: registration.school,
      center: registration.center,
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="registration-slip-${registration.registrationNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error("Error generating registration slip:", error)
    return NextResponse.json(
      { error: "Failed to generate registration slip" },
      { status: 500 }
    )
  }
}
