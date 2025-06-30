import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(
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
    const data = await request.json()

    // Validate the registration exists
    const existingRegistration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId)
    })

    if (!existingRegistration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Update the registration
    const updatedRegistration = await db
      .update(registrations)
      .set({
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        chapterId: data.chapterId,
        schoolId: data.schoolId,
        schoolName: data.schoolName,
        centerId: data.centerId,
        parentFirstName: data.parentFirstName,
        parentLastName: data.parentLastName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        paymentStatus: data.paymentStatus,
      })
      .where(eq(registrations.id, registrationId))
      .returning()

    return NextResponse.json({
      message: "Registration updated successfully",
      registration: updatedRegistration[0]
    })

  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Validate the registration exists
    const existingRegistration = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId)
    })

    if (!existingRegistration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Delete the registration
    await db
      .delete(registrations)
      .where(eq(registrations.id, registrationId))

    return NextResponse.json({
      message: "Registration deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting registration:", error)
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    )
  }
}
