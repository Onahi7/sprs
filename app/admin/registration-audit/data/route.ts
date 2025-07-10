import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { chapters, registrations, slotPurchases, chapterCoordinators, centers, schools } from '@/db/schema'
import { eq, and, isNotNull, isNull, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')

    if (!chapterId || chapterId === 'all') {
      // Get summary for all chapters
      const allStats = await db
        .select({
          chapterId: chapters.id,
          chapterName: chapters.name,
          slotRegistrations: sql<number>`
            COUNT(CASE WHEN ${registrations.coordinatorRegisteredBy} IS NOT NULL THEN 1 END)
          `,
          singularRegistrations: sql<number>`
            COUNT(CASE WHEN ${registrations.coordinatorRegisteredBy} IS NULL THEN 1 END)
          `,
          totalRegistrations: sql<number>`COUNT(*)`,
          totalSlotsSold: sql<number>`
            COALESCE(
              (SELECT SUM(sp.slots_purchased) 
               FROM ${slotPurchases} sp 
               WHERE sp.chapter_id = ${chapters.id} 
               AND sp.payment_status = 'completed'), 
              0
            )
          `,
          totalSlotRevenue: sql<number>`
            COALESCE(
              (SELECT SUM(sp.amount_paid) 
               FROM ${slotPurchases} sp 
               WHERE sp.chapter_id = ${chapters.id} 
               AND sp.payment_status = 'completed'), 
              0
            )
          `
        })
        .from(registrations)
        .leftJoin(centers, eq(registrations.centerId, centers.id))
        .leftJoin(chapters, eq(centers.chapterId, chapters.id))
        .where(eq(registrations.paymentStatus, 'completed'))
        .groupBy(chapters.id, chapters.name)
        .orderBy(chapters.name)

      return NextResponse.json({
        success: true,
        data: allStats
      })
    }

    // Get detailed data for specific chapter
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

    return NextResponse.json({
      success: true,
      data: {
        chapter: chapterData[0],
        slotRegistrations,
        singularRegistrations,
        summary
      }
    })

  } catch (error) {
    console.error('Error fetching registration audit data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit data' },
      { status: 500 }
    )
  }
}
