// filepath: c:\Users\HP\Downloads\sprs\app\api\registrations\route.ts
import { NextResponse } from "next/server"
import { registrations, chapters, schools, centers, settings } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import { sendRegistrationConfirmationEmail, sendCoordinatorNotificationEmail } from "@/lib/email"
import { getDbConnection } from "@/db/utils"
import { getSystemSettings } from "@/lib/settings"

export async function POST(request: Request) {
  try {
    // Check if registrations are enabled
    const systemSettings = await getSystemSettings();
    if (!systemSettings.registrationEnabled) {
      return NextResponse.json(
        { error: "Registrations are currently closed", code: "REGISTRATIONS_CLOSED" },
        { status: 403 }
      );
    }
    
    const data = await request.json()
    const db = getDbConnection();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "chapterId",
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
    }    // Validate that either schoolId or schoolName is provided
    if (!data.schoolId && !data.schoolName) {
      return NextResponse.json({ error: "Either schoolId or schoolName is required" }, { status: 400 })
    }

    // Generate registration number - Format: NAPPS-XXXXXXYYY (X=timestamp digits, Y=random letters)
    // Use more random characters for better uniqueness
    const registrationNumber = `NAPPS-${Date.now().toString().slice(-6)}${nanoid(4).toUpperCase()}`

    // Handle school resolution and auto-creation
    let schoolId = data.schoolId
    let schoolName = data.schoolName

    if (data.schoolId && !schoolName) {
      // Case 1: schoolId provided, get school name from database
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, data.schoolId),
      })
      schoolName = school?.name || null
    } else if (!data.schoolId && schoolName) {
      // Case 2: schoolName provided manually, check if school already exists for this chapter
      const existingSchool = await db.query.schools.findFirst({
        where: and(
          eq(schools.chapterId, data.chapterId),
          eq(schools.name, schoolName.trim())
        ),
      })

      if (existingSchool) {
        // School already exists, use it
        schoolId = existingSchool.id
      } else {
        // School doesn't exist, create it
        const newSchoolResult = await db.insert(schools).values({
          chapterId: data.chapterId,
          name: schoolName.trim(),
          createdAt: new Date(),
        }).returning()
        
        schoolId = newSchoolResult[0].id
        console.log(`✅ Auto-created school "${schoolName}" for chapter ${data.chapterId}`)
      }
    }

    // Insert registration
    const result = await db.insert(registrations).values({
      registrationNumber,
      firstName: data.firstName,
      middleName: data.middleName || null,
      lastName: data.lastName,
      chapterId: data.chapterId,
      schoolId: schoolId,
      schoolName: schoolName,
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

    const newRegistration = result[0];    // Get chapter, school, and center details for email
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, data.chapterId),
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
        school: schoolName || `School ID: ${data.schoolId}`,
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

    // For public requests, check if registrations are enabled
    if (!searchParams.get("adminRequest") && !searchParams.get("coordinatorRequest")) {
      const systemSettings = await getSystemSettings();
      if (!systemSettings.registrationEnabled) {
        return NextResponse.json(
          { error: "Registrations are currently closed", code: "REGISTRATIONS_CLOSED" },
          { status: 403 }
        );
      }
    }

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
