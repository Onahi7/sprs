import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations } from "@/db/schema"
import { and, eq, ilike, or, sql } from "drizzle-orm"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName, middleName, chapterId } = await request.json()
    
    if (!firstName || !lastName || !chapterId) {
      return NextResponse.json({ 
        error: "First name, last name, and chapter ID are required" 
      }, { status: 400 })
    }

    const db = getDbConnection()
    
    // Build search conditions for name matching
    const nameConditions = []
    
    // Exact match for first name and last name
    nameConditions.push(
      and(
        ilike(registrations.firstName, firstName.trim()),
        ilike(registrations.lastName, lastName.trim()),
        eq(registrations.chapterId, chapterId)
      )
    )
    
    // If middle name provided, also check with middle name variations
    if (middleName?.trim()) {
      nameConditions.push(
        and(
          ilike(registrations.firstName, firstName.trim()),
          ilike(registrations.lastName, lastName.trim()),
          ilike(registrations.middleName, middleName.trim()),
          eq(registrations.chapterId, chapterId)
        )
      )
    }
    
    // Check for similar names (first + last name swapped)
    nameConditions.push(
      and(
        ilike(registrations.firstName, lastName.trim()),
        ilike(registrations.lastName, firstName.trim()),
        eq(registrations.chapterId, chapterId)
      )
    )
    
    // Find potential duplicates
    const duplicates = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: registrations.schoolName,
        paymentStatus: registrations.paymentStatus,
        createdAt: registrations.createdAt,
        coordinatorRegisteredBy: registrations.coordinatorRegisteredBy
      })
      .from(registrations)
      .where(or(...nameConditions))
      .limit(10) // Limit to 10 potential matches

    if (duplicates.length > 0) {
      return NextResponse.json({
        hasDuplicates: true,
        duplicates,
        message: `Found ${duplicates.length} potential duplicate registration(s)`,
        suggestion: "Please review the existing registrations below. If this is a different student with the same name, you can continue with the registration."
      })
    }

    return NextResponse.json({
      hasDuplicates: false,
      message: "No duplicate registrations found"
    })

  } catch (error) {
    console.error("Duplicate check error:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    )
  }
}
