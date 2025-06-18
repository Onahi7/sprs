import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"
import { sendCoordinatorDuplicateNotificationEmail } from "@/lib/email"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 })
    }

    const registrationId = parseInt(params.id)
    const { reason } = await request.json()

    if (!registrationId || isNaN(registrationId)) {
      return NextResponse.json({ error: "Invalid registration ID" }, { status: 400 })
    }

    const db = getDbConnection()

    // Get registration details before deletion
    const registration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId),
      with: {
        chapter: true
      }
    })

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Get coordinator information if this was a coordinator registration
    let coordinatorInfo = null
    if (registration.coordinatorRegisteredBy) {
      coordinatorInfo = await db.query.chapterCoordinators.findFirst({
        where: eq(chapterCoordinators.id, registration.coordinatorRegisteredBy)
      })
    }

    // Delete the registration
    const deletedRegistration = await db
      .delete(registrations)
      .where(eq(registrations.id, registrationId))
      .returning()

    if (deletedRegistration.length === 0) {
      return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 })
    }

    // Send notification email to coordinator if applicable
    if (coordinatorInfo?.email) {
      try {
        await sendCoordinatorDuplicateNotificationEmail({
          to: coordinatorInfo.email,
          coordinatorName: coordinatorInfo.name || "Coordinator",
          studentName: `${registration.firstName} ${registration.middleName ? registration.middleName + ' ' : ''}${registration.lastName}`,
          registrationNumber: registration.registrationNumber,
          chapterName: registration.chapter?.name || "Unknown Chapter",
          reason: reason || "Duplicate registration detected",
          adminUser: session.username || "Admin"
        })
      } catch (emailError) {
        console.error("Error sending coordinator notification:", emailError)
        // Don't fail the deletion if email fails
      }
    }

    console.log(`🗑️ Admin ${session.username || session.id} deleted duplicate registration ${registration.registrationNumber} - Reason: ${reason || 'No reason provided'}`)

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
      deletedRegistration: {
        id: registration.id,
        registrationNumber: registration.registrationNumber,
        studentName: `${registration.firstName} ${registration.middleName ? registration.middleName + ' ' : ''}${registration.lastName}`,
        chapterName: registration.chapter?.name
      }
    })

  } catch (error) {
    console.error("Error deleting duplicate registration:", error)
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    )
  }
}
