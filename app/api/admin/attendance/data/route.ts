import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { chapters, centers, registrations, chapterCoordinators } from "@/db/schema"
import { eq, count, sql } from "drizzle-orm"

export async function GET() {
  try {
    // Fetch chapters with registration counts
    const chaptersWithCounts = await db
      .select({
        id: chapters.id,
        name: chapters.name,
        registrationCount: count(registrations.id),
        centerCount: sql<number>`(SELECT COUNT(*) FROM ${centers} WHERE ${centers.chapterId} = ${chapters.id})`
      })
      .from(chapters)
      .leftJoin(registrations, eq(registrations.chapterId, chapters.id))
      .groupBy(chapters.id, chapters.name)
      .orderBy(chapters.name)

    // Fetch centers with registration counts and coordinator names
    const centersWithCounts = await db
      .select({
        id: centers.id,
        name: centers.name,
        chapterId: centers.chapterId,
        registrationCount: count(registrations.id),
        coordinatorName: sql<string>`COALESCE(${chapterCoordinators.name}, 'No Coordinator')`
      })
      .from(centers)
      .leftJoin(registrations, eq(registrations.centerId, centers.id))
      .leftJoin(chapterCoordinators, eq(chapterCoordinators.chapterId, centers.chapterId))
      .groupBy(centers.id, centers.name, centers.chapterId, chapterCoordinators.name)
      .orderBy(centers.name)

    return NextResponse.json({
      chapters: chaptersWithCounts,
      centers: centersWithCounts
    })
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json(
      { error: "Failed to fetch attendance data" },
      { status: 500 }
    )
  }
}
