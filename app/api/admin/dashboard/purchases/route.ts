import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { slotPurchases, chapterCoordinators, chapters, slotPackages } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getDbConnection()
  const purchases = await db
    .select({
      id: slotPurchases.id,
      coordinatorName: chapterCoordinators.name,
      coordinatorEmail: chapterCoordinators.email,
      chapterName: chapters.name,
      packageName: slotPackages.name,
      slotsPurchased: slotPurchases.slotsPurchased,
      amountPaid: slotPurchases.amountPaid,
      paymentStatus: slotPurchases.paymentStatus,
      purchaseDate: slotPurchases.purchaseDate,
    })
    .from(slotPurchases)
    .leftJoin(chapterCoordinators, eq(slotPurchases.coordinatorId, chapterCoordinators.id))
    .leftJoin(chapters, eq(slotPurchases.chapterId, chapters.id))
    .leftJoin(slotPackages, eq(slotPurchases.slotPackageId, slotPackages.id))
    .orderBy(desc(slotPurchases.purchaseDate))

  return NextResponse.json(purchases)
}
