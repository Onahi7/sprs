import { NextRequest, NextResponse } from 'next/server';
import { sendSlotPurchaseConfirmationEmail } from '@/lib/email-resend';
import { db } from '@/db';
import { chapterCoordinators, slotPurchases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json(
        { error: 'Purchase ID is required' },
        { status: 400 }
      );
    }

    // Get purchase details
    if (!db) throw new Error('Database connection failed')
    const purchase = await db
      .select({
        id: slotPurchases.id,
        coordinatorId: slotPurchases.coordinatorId,
        amountPaid: slotPurchases.amountPaid,
        slotsPurchased: slotPurchases.slotsPurchased,
        paymentReference: slotPurchases.paymentReference,
        purchaseDate: slotPurchases.purchaseDate,
        coordinatorName: chapterCoordinators.name,
        coordinatorEmail: chapterCoordinators.email,
        chapterName: chapterCoordinators.chapterId,
      })
      .from(slotPurchases)
      .innerJoin(chapterCoordinators, eq(slotPurchases.coordinatorId, chapterCoordinators.id))
      .where(eq(slotPurchases.id, purchaseId))
      .limit(1);

    if (!purchase[0]) {
      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const purchaseData = purchase[0];

    // Send confirmation email
    await sendSlotPurchaseConfirmationEmail({
      to: purchaseData.coordinatorEmail,
      coordinatorName: purchaseData.coordinatorName,
      chapterName: purchaseData.chapterName ? purchaseData.chapterName.toString() : '',
      packageName: 'Slot Package',
      slotsPurchased: purchaseData.slotsPurchased,
      amountPaid: purchaseData.amountPaid,
      paymentReference: purchaseData.paymentReference,
      currentSlotBalance: 0,
      transactionDate: purchaseData.purchaseDate ? purchaseData.purchaseDate.toISOString() : '',
    });

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
    });
  } catch (error) {
    console.error('Error resending confirmation email:', error);
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    );
  }
}
