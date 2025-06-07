import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { chapterSplitCodes, chapters, slotPackages } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDbConnection()
    
    // Get all split codes with chapter and package details
    const splitCodes = await db
      .select({
        id: chapterSplitCodes.id,
        chapterId: chapterSplitCodes.chapterId,
        chapterName: chapters.name,
        slotPackageId: chapterSplitCodes.slotPackageId,
        packageName: slotPackages.name,
        slotCount: slotPackages.slotCount,
        splitCode: chapterSplitCodes.splitCode,
        isActive: chapterSplitCodes.isActive,
        createdAt: chapterSplitCodes.createdAt,
        updatedAt: chapterSplitCodes.updatedAt,
      })
      .from(chapterSplitCodes)
      .leftJoin(chapters, eq(chapterSplitCodes.chapterId, chapters.id))
      .leftJoin(slotPackages, eq(chapterSplitCodes.slotPackageId, slotPackages.id))
      .orderBy(chapters.name, slotPackages.slotCount)

    return NextResponse.json({ splitCodes })
  } catch (error) {
    console.error("Error fetching split codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch split codes" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { chapterId, slotPackageId, splitCode, isActive = true } = body

    if (!chapterId || !slotPackageId || !splitCode) {
      return NextResponse.json(
        { error: "Chapter ID, slot package ID, and split code are required" },
        { status: 400 }
      )
    }

    const db = getDbConnection()

    // Check if split code already exists for this chapter-package combination
    const existing = await db
      .select()
      .from(chapterSplitCodes)
      .where(
        and(
          eq(chapterSplitCodes.chapterId, parseInt(chapterId)),
          eq(chapterSplitCodes.slotPackageId, parseInt(slotPackageId))
        )
      )
      .limit(1)

    if (existing.length > 0) {
      // Update existing split code
      const updated = await db
        .update(chapterSplitCodes)
        .set({
          splitCode: splitCode.trim(),
          isActive: isActive,
          updatedAt: new Date(),
        })
        .where(eq(chapterSplitCodes.id, existing[0].id))
        .returning()

      return NextResponse.json({
        success: true,
        message: "Split code updated successfully",
        splitCode: updated[0]
      })
    } else {
      // Create new split code
      const created = await db
        .insert(chapterSplitCodes)
        .values({
          chapterId: parseInt(chapterId),
          slotPackageId: parseInt(slotPackageId),
          splitCode: splitCode.trim(),
          isActive: isActive,
        })
        .returning()

      return NextResponse.json({
        success: true,
        message: "Split code created successfully",
        splitCode: created[0]
      })
    }
  } catch (error) {
    console.error("Error managing split code:", error)
    return NextResponse.json(
      { error: "Failed to manage split code" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Split code ID is required" },
        { status: 400 }
      )
    }

    const db = getDbConnection()
    
    // Soft delete by setting isActive to false
    await db
      .update(chapterSplitCodes)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(chapterSplitCodes.id, parseInt(id)))

    return NextResponse.json({
      success: true,
      message: "Split code deactivated successfully"
    })
  } catch (error) {
    console.error("Error deleting split code:", error)
    return NextResponse.json(
      { error: "Failed to delete split code" },
      { status: 500 }
    )
  }
}
