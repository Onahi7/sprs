// filepath: c:\Users\HP\Downloads\sprs\app\api\registrations\route.ts
import { NextResponse } from "next/server"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { nanoid } from "nanoid"
import { sendRegistrationConfirmationEmail, sendCoordinatorNotificationEmail } from "@/lib/email"
import { getDbConnection } from "@/db/utils"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDbConnection();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "chapterId",
      "schoolId",
      "centerId",
      "parentFirstName",
      "parentLastName",
      "parentEmail",
      "parentPhone",
      "parentConsent",
      "passportUrl",
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Generate registration number - Format: NAPPS-XXXXXXYY (X=timestamp digits, Y=random letters)
    const registrationNumber = `NAPPS-${Date.now().toString().slice(-6)}${nanoid(2).toUpperCase()}`

    // Insert registration
    const result = await db.insert(registrations).values({
      registrationNumber,
      firstName: data.firstName,
      middleName: data.middleName || null,
      lastName: data.lastName,
      chapterId: data.chapterId,
      schoolId: data.schoolId,
      schoolName: data.schoolName || null,
      centerId: data.centerId,
      parentFirstName: data.parentFirstName,
      parentLastName: data.parentLastName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone,
      parentConsent: data.parentConsent,
      passportUrl: data.passportUrl,
      paymentStatus: "pending",
      createdAt: new Date(),
    }).returning();

    const newRegistration = result[0];

    // Get chapter, school, and center details for email
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, data.chapterId),
    })

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, data.schoolId),
    })

    const center = await db.query.centers.findFirst({
      where: eq(centers.id, data.centerId),
    })

    // Send registration confirmation email
    try {
      await sendRegistrationConfirmationEmail({
        to: data.parentEmail,
        name: `${data.firstName} ${data.lastName}`,
        registrationNumber,
        chapter: chapter?.name || `Chapter ID: ${data.chapterId}`,
        school: data.schoolName || school?.name || `School ID: ${data.schoolId}`,
        center: center?.name || `Center ID: ${data.centerId}`,
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the registration if email sending fails
    }

    // Get coordinator email for notification
    const coordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapters.id, data.chapterId),
    })

    if (coordinator) {
      try {
        await sendCoordinatorNotificationEmail({
          to: coordinator.email,
          coordinatorName: coordinator.name || "Coordinator",
          studentName: `${data.firstName} ${data.lastName}`,
          registrationNumber,
          chapter: chapter?.name || `Chapter ID: ${data.chapterId}`,
        })
      } catch (emailError) {
        console.error("Error sending coordinator notification:", emailError);
        // Don't fail the registration if email sending fails
      }
    }

    return NextResponse.json({
      success: true,
      id: newRegistration.id,
      registrationNumber,
      message: "Registration successful",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const db = getDbConnection();
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const chapterId = searchParams.get("chapterId") ? Number.parseInt(searchParams.get("chapterId") || "0") : null

    // Get recent registrations (limited to 100 by default)
    const recentRegistrations = await db.query.registrations.findMany({
      limit,
      where: chapterId ? eq(registrations.chapterId, chapterId) : undefined,
      orderBy: [desc(registrations.createdAt)],
      with: {
        chapter: true,
        school: true,
        center: true,
      },
    })

    return NextResponse.json(recentRegistrations)
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
