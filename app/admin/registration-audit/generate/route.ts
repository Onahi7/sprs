import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { chapters, registrations, slotPurchases, chapterCoordinators, centers, schools } from '@/db/schema'
import { eq, and, isNotNull, isNull, sql } from 'drizzle-orm'
import { generateRegistrationAuditPDF } from '@/lib/registration-audit-pdf'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId || chapterId === 'all') {
      return NextResponse.json(
        { success: false, error: 'Chapter ID is required for PDF generation' },
        { status: 400 }
      )
    }

    // Get chapter data
    const chapterData = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, parseInt(chapterId)))
      .limit(1)

    if (chapterData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Get slot registrations (registrations made by coordinators)
    const slotRegistrations = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: schools.name,
        centerName: centers.name,
        coordinatorName: chapterCoordinators.name,
        registrationDate: registrations.createdAt
      })
      .from(registrations)
      .innerJoin(chapterCoordinators, eq(registrations.coordinatorRegisteredBy, chapterCoordinators.id))
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .leftJoin(chapters, eq(centers.chapterId, chapters.id))
      .where(
        and(
          eq(chapters.id, parseInt(chapterId)),
          eq(registrations.paymentStatus, 'completed'),
          isNotNull(registrations.coordinatorRegisteredBy)
        )
      )
      .orderBy(registrations.registrationNumber)

    // Get singular registrations (public registrations, not coordinator-based)
    const singularRegistrations = await db
      .select({
        id: registrations.id,
        registrationNumber: registrations.registrationNumber,
        firstName: registrations.firstName,
        middleName: registrations.middleName,
        lastName: registrations.lastName,
        schoolName: schools.name,
        centerName: centers.name,
        registrationDate: registrations.createdAt
      })
      .from(registrations)
      .leftJoin(centers, eq(registrations.centerId, centers.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .leftJoin(chapters, eq(centers.chapterId, chapters.id))
      .where(
        and(
          eq(chapters.id, parseInt(chapterId)),
          eq(registrations.paymentStatus, 'completed'),
          isNull(registrations.coordinatorRegisteredBy)
        )
      )
      .orderBy(registrations.registrationNumber)

    // Get slot purchase statistics for this chapter
    const slotStats = await db
      .select({
        totalSlotsSold: sql<number>`SUM(slots_purchased)`,
        totalRevenue: sql<number>`SUM(amount_paid)`
      })
      .from(slotPurchases)
      .where(
        and(
          eq(slotPurchases.chapterId, parseInt(chapterId)),
          eq(slotPurchases.paymentStatus, 'completed')
        )
      )

    const slotData = slotStats[0] || { totalSlotsSold: 0, totalRevenue: 0 }

    // Calculate summary
    const summary = {
      totalSlotRegistrations: slotRegistrations.length,
      totalSingularRegistrations: singularRegistrations.length,
      totalRegistrations: slotRegistrations.length + singularRegistrations.length,
      totalSlotsSold: Number(slotData.totalSlotsSold) || 0,
      totalSlotRevenue: Number(slotData.totalRevenue) || 0,
      generatedDate: new Date()
    }

    // Prepare data for PDF generation (map to expected interface)
    const auditData = {
      chapter: chapterData[0],
      slotRegistrations: slotRegistrations.map(reg => ({
        id: reg.id,
        registrationNumber: reg.registrationNumber,
        firstName: reg.firstName,
        middleName: reg.middleName,
        lastName: reg.lastName,
        schoolName: reg.schoolName,
        centerName: reg.centerName,
        slotQuantity: 1, // Each coordinator registration uses 1 slot
        slotAmount: '0', // Amount is tracked at coordinator level, not per registration
        slotPaymentRef: null,
        registrationDate: reg.registrationDate,
        slotPurchaseDate: reg.registrationDate
      })),
      singularRegistrations,
      summary
    }

    // Generate PDF
    const pdfBuffer = await generateRegistrationAuditPDF(auditData)

    // Create filename
    const chapterName = chapterData[0].name.replace(/[^a-zA-Z0-9]/g, '_')
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Registration_Audit_${chapterName}_${dateStr}.pdf`

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating registration audit PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
