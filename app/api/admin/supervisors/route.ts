import { NextResponse } from "next/server";
import { getDbConnection } from "@/db";
import { supervisors, chapters, centers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId");
  try {
    const db = getDbConnection();
    let result;
    if (chapterId) {
      result = await db.select({
        id: supervisors.id,
        chapterId: supervisors.chapterId,
        centerId: supervisors.centerId,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        isActive: supervisors.isActive,
        createdAt: supervisors.createdAt,
        updatedAt: supervisors.updatedAt,
        chapterName: chapters.name,
        centerName: centers.name,
      })
      .from(supervisors)
      .leftJoin(chapters, eq(supervisors.chapterId, chapters.id))
      .leftJoin(centers, eq(supervisors.centerId, centers.id))
      .where(eq(supervisors.chapterId, parseInt(chapterId)))
      .execute();
    } else {
      result = await db.select({
        id: supervisors.id,
        chapterId: supervisors.chapterId,
        centerId: supervisors.centerId,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        isActive: supervisors.isActive,
        createdAt: supervisors.createdAt,
        updatedAt: supervisors.updatedAt,
        chapterName: chapters.name,
        centerName: centers.name,
      })
      .from(supervisors)
      .leftJoin(chapters, eq(supervisors.chapterId, chapters.id))
      .leftJoin(centers, eq(supervisors.centerId, centers.id))
      .execute();
    }
    return NextResponse.json({ supervisors: result });
  } catch (error) {
    console.error("Database error:", error);
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch supervisors"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
