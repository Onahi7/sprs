import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"

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
        coordinatorRegisteredBy: true,
      },
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Transform the data for frontend
    const transformedRegistration = {
      id: registration.id,
      registrationNumber: registration.registrationNumber,
      firstName: registration.firstName,
      middleName: registration.middleName,
      lastName: registration.lastName,
      chapterId: registration.chapterId,
      chapterName: registration.chapter?.name || 'Unknown Chapter',
      schoolId: registration.schoolId,
      schoolName: registration.school?.name || registration.schoolName || 'Unknown School',
      centerId: registration.centerId,
      centerName: registration.center?.name || null,
      parentFirstName: registration.parentFirstName,
      parentLastName: registration.parentLastName,
      parentPhone: registration.parentPhone,
      parentEmail: registration.parentEmail,
      parentConsent: registration.parentConsent,
      passportUrl: registration.passportUrl,
      paymentStatus: registration.paymentStatus,
      paymentReference: registration.paymentReference,
      splitCodeUsed: registration.splitCodeUsed,
      registrationType: registration.registrationType,
      coordinatorRegisteredBy: registration.coordinatorRegisteredBy,
      coordinatorName: registration.coordinatorRegisteredBy?.name || null,
      registrationSlipDownloaded: registration.registrationSlipDownloaded,
      registrationSlipDownloadCount: registration.registrationSlipDownloadCount,
      createdAt: registration.createdAt,
    }

    return NextResponse.json(transformedRegistration)

  } catch (error) {
    console.error("Error fetching registration details:", error)
    return NextResponse.json(
      { error: "Failed to fetch registration details" },
      { status: 500 }
    )
  }
}
