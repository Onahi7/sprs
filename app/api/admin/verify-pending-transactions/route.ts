import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations } from "@/db/schema"
import { eq, and, lt, isNotNull } from "drizzle-orm"
import { verifyPayment } from "@/lib/payment"

export async function POST() {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
    
    // Get all pending registrations with payment references older than 30 minutes
    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    const pendingRegistrations = await db.query.registrations.findMany({
      where: and(
        eq(registrations.paymentStatus, "pending"),
        isNotNull(registrations.paymentReference),
        lt(registrations.updatedAt || registrations.createdAt, thirtyMinutesAgo),
      ),
    })

    if (pendingRegistrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending transactions to verify",
        updatedCount: 0,
      })
    }

    // Verify each payment with Paystack API
    let updatedCount = 0

    for (const registration of pendingRegistrations) {
      if (!registration.paymentReference) {
        continue
      }
      
      try {
        // Verify with Paystack
        const result = await verifyPayment(registration.paymentReference)
        
        if (result.success) {
          // Update the registration
          await db
            .update(registrations)
            .set({
              paymentStatus: "completed",
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, registration.id))
          
          updatedCount++
        }
      } catch (error) {
        console.error(`Error verifying payment for registration ${registration.registrationNumber}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verified ${updatedCount} out of ${pendingRegistrations.length} pending transactions`,
      updatedCount,
    })
  } catch (error) {
    console.error("Error verifying pending transactions:", error)
    return NextResponse.json({ error: "Failed to verify transactions" }, { status: 500 })
  }
}
      verifiedCount,
      totalCount: pendingRegistrations.length,
    })
  } catch (error) {
    console.error("Error verifying pending transactions:", error)
    return NextResponse.json({ error: "Failed to verify pending transactions" }, { status: 500 })
  }
}
