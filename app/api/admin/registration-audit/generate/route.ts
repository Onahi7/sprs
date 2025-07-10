import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { chapters, registrations, slotPurchases, schools, centers } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { generateRegistrationAuditPDF } from "@/lib/registration-audit-pdf"

export async function POST(request: NextRequest) {
  try {
    const db = getDbConnection()

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      )
    }

    // Fetch chapter details
    const chapter = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, parseInt(chapterId)))
      .limit(1)

    if (!chapter.length) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    // Get slot registrations with detailed information
    const slotRegistrations = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: registrations.schoolName,
        centerName: centers.name,
        slotQuantity: slotPurchases.quantity,
        slotAmount: slotPurchases.amount,
        slotPaymentRef: slotPurchases.paymentReference,
        registrationDate: registrations.createdAt,
        slotPurchaseDate: slotPurchases.createdAt
      })
      .from(registrations)
      .innerJoin(slotPurchases, eq(registrations.id, slotPurchases.registrationId))
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .where(and(
        eq(registrations.chapterId, parseInt(chapterId)),
        eq(registrations.paymentStatus, "completed"),
        eq(slotPurchases.paymentStatus, "completed")
      ))

    // Get singular registrations (not in slot purchases)
    const singularRegistrations = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: registrations.schoolName,
        centerName: centers.name,
        registrationDate: registrations.createdAt
      })
      .from(registrations)
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .where(and(
        eq(registrations.chapterId, parseInt(chapterId)),
        eq(registrations.paymentStatus, "completed"),
        sql`${registrations.id} NOT IN (
          SELECT registration_id FROM ${slotPurchases} 
          WHERE payment_status = 'completed'
        )`
      ))

    // Calculate summary statistics
    const totalSlotsSold = slotRegistrations.reduce((sum, reg) => sum + (reg.slotQuantity || 0), 0)
    const totalSlotRevenue = slotRegistrations.reduce((sum, reg) => sum + parseFloat(reg.slotAmount || '0'), 0)

    const auditData = {
      chapter: chapter[0],
      slotRegistrations,
      singularRegistrations,
      summary: {
        totalSlotRegistrations: slotRegistrations.length,
        totalSingularRegistrations: singularRegistrations.length,
        totalRegistrations: slotRegistrations.length + singularRegistrations.length,
        totalSlotsSold,
        totalSlotRevenue,
        generatedDate: new Date()
      }
    }

    // Generate PDF
    const pdfBuffer = await generateRegistrationAuditPDF(auditData)

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Length', pdfBuffer.length.toString())
    
    const fileName = `registration_audit_${chapter[0].name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`)

    return new NextResponse(pdfBuffer, { headers })

  } catch (error) {
    console.error("Error generating registration audit PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate audit report" },
      { status: 500 }
    )
  }
}
