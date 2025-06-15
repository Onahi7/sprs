import { NextResponse } from "next/server";
import { getDbConnection } from "@/db";
import { facilitators, chapters } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chapterId = searchParams.get("chapterId");
  try {
    const db = getDbConnection();
    let result;
    if (chapterId) {
      result = await db.select({
        ...facilitators,
        chapterName: chapters.name,
      })
      .from(facilitators)
      .leftJoin(chapters, eq(facilitators.chapterId, chapters.id))
      .where(eq(facilitators.chapterId, parseInt(chapterId)))
      .execute();
    } else {
      result = await db.select({
        ...facilitators,
        chapterName: chapters.name,
      })
      .from(facilitators)
      .leftJoin(chapters, eq(facilitators.chapterId, chapters.id))
      .execute();
    }
    return NextResponse.json({ facilitators: result });
  } catch (error) {
    console.error("Database error:", error);
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch facilitators"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
