import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters } from "@/db/schema"
import { eq, and, isNotNull } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 })
    }

    const db = getDbConnection()

    // Get the chapter's split code first
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(chapterId)),
    })

    if (!chapter || !chapter.splitCode) {
      return NextResponse.json({ 
        success: true, 
        transactions: [], 
        message: "No split code configured for this chapter" 
      })
    }

    // Get all completed payments for this chapter
    const splitTransactions = await db.query.registrations.findMany({
      where: and(
        eq(registrations.chapterId, parseInt(chapterId)),
        eq(registrations.paymentStatus, "completed"),
        isNotNull(registrations.paymentReference)
      ),
      with: {
        school: true,
        center: true,
      },
      orderBy: (registrations, { desc }) => [desc(registrations.createdAt)],
    })

    // Format the response data
    const formattedTransactions = splitTransactions.map((transaction) => ({
      id: transaction.id,
      registrationNumber: transaction.registrationNumber,
      studentName: `${transaction.firstName} ${transaction.lastName}`,
      schoolName: transaction.school?.name || transaction.schoolName || "Unknown School",
      centerName: transaction.center?.name || "Unknown Center",
      parentEmail: transaction.parentEmail,
      paymentReference: transaction.paymentReference,
      splitCode: chapter.splitCode,
      amount: chapter.amount || "3000.00",
      paidAt: transaction.createdAt,
      status: transaction.paymentStatus,
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      splitCode: chapter.splitCode,
      totalTransactions: formattedTransactions.length,
      totalAmount: formattedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0),
    })
  } catch (error) {
    console.error("Error fetching split transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch split transactions" },
      { status: 500 }
    )
  }
}
