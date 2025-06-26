import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { supervisors, supervisorSessions } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

// POST - Supervisor Login with Phone Number + PIN
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phoneNumber, pin, action } = body

    if (!phoneNumber) {
      return new NextResponse(JSON.stringify({
        error: "Phone number is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const db = getDbConnection()

    // Find supervisor by phone number
    const supervisor = await db.select()
      .from(supervisors)
      .where(and(
        eq(supervisors.phoneNumber, phoneNumber),
        eq(supervisors.isActive, true)
      ))
      .limit(1)
      .execute()

    if (supervisor.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "Supervisor not found or inactive"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }

    const supervisorData = supervisor[0]

    // Handle PIN setup (first-time login)
    if (action === "setup" && !supervisorData.pin) {
      if (!pin || pin.length < 4 || pin.length > 6) {
        return new NextResponse(JSON.stringify({
          error: "PIN must be 4-6 digits"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pin, 10)

      // Update supervisor with PIN
      await db.update(supervisors)
        .set({ 
          pin: hashedPin,
          lastLogin: new Date()
        })
        .where(eq(supervisors.id, supervisorData.id))
        .execute()

      // Create session
      const sessionToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

      await db.insert(supervisorSessions).values({
        supervisorId: supervisorData.id,
        sessionToken,
        expiresAt
      }).execute()

      return NextResponse.json({
        message: "PIN setup successful",
        sessionToken,
        supervisor: {
          id: supervisorData.id,
          name: supervisorData.name,
          phoneNumber: supervisorData.phoneNumber,
          schoolName: supervisorData.schoolName,
          centerId: supervisorData.centerId,
          chapterId: supervisorData.chapterId
        }
      })
    }

    // Handle regular login
    if (action === "login") {
      if (!supervisorData.pin) {
        return new NextResponse(JSON.stringify({
          error: "PIN_SETUP_REQUIRED",
          message: "Please set up your PIN first"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }

      if (!pin) {
        return new NextResponse(JSON.stringify({
          error: "PIN is required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }

      // Verify PIN
      const pinValid = await bcrypt.compare(pin, supervisorData.pin)
      if (!pinValid) {
        return new NextResponse(JSON.stringify({
          error: "Invalid PIN"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
      }

      // Update last login
      await db.update(supervisors)
        .set({ lastLogin: new Date() })
        .where(eq(supervisors.id, supervisorData.id))
        .execute()

      // Create session
      const sessionToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours

      await db.insert(supervisorSessions).values({
        supervisorId: supervisorData.id,
        sessionToken,
        expiresAt
      }).execute()

      return NextResponse.json({
        message: "Login successful",
        sessionToken,
        supervisor: {
          id: supervisorData.id,
          name: supervisorData.name,
          phoneNumber: supervisorData.phoneNumber,
          schoolName: supervisorData.schoolName,
          centerId: supervisorData.centerId,
          chapterId: supervisorData.chapterId
        }
      })
    }

    // Check if PIN setup is required
    if (!supervisorData.pin) {
      return NextResponse.json({
        setupRequired: true,
        message: "PIN setup required",
        supervisor: {
          id: supervisorData.id,
          name: supervisorData.name,
          phoneNumber: supervisorData.phoneNumber,
          schoolName: supervisorData.schoolName
        }
      })
    }

    return NextResponse.json({
      setupRequired: false,
      message: "Please enter your PIN",
      supervisor: {
        id: supervisorData.id,
        name: supervisorData.name,
        phoneNumber: supervisorData.phoneNumber,
        schoolName: supervisorData.schoolName
      }
    })

  } catch (error) {
    console.error("Supervisor auth error:", error)
    return new NextResponse(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

// DELETE - Supervisor Logout
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionToken = searchParams.get("token")

    if (!sessionToken) {
      return new NextResponse(JSON.stringify({
        error: "Session token required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const db = getDbConnection()

    // Delete session
    await db.delete(supervisorSessions)
      .where(eq(supervisorSessions.sessionToken, sessionToken))
      .execute()

    return NextResponse.json({ message: "Logout successful" })

  } catch (error) {
    console.error("Supervisor logout error:", error)
    return new NextResponse(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
