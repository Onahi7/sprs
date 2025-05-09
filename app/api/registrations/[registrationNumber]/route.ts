import { NextResponse } from "next/server"
import { db } from "@/db"
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request, { params }: { params: { registrationNumber: string } }) {
  try {
    const { registrationNumber } = params

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

    return NextResponse.json(registration)
  } catch (error) {
    console.error("Error fetching registration details:", error)
    return NextResponse.json({ error: "Failed to fetch registration details" }, { status: 500 })
  }
}
