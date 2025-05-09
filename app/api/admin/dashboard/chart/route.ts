import { NextResponse } from "next/server"
import { db } from "@/db"
import { registrations, chapters } from "@/db/schema"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    // Get data for the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Format date as YYYY-MM-DD for SQL
    const formattedDate = sevenDaysAgo.toISOString().split("T")[0]

    // First, get all chapters
    const allChapters = await db.query.chapters.findMany({
      orderBy: (chapters, { asc }) => [asc(chapters.name)],
    })

    // Get the dates for the last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    })

    // Query to get daily registration counts by chapter for the last 7 days
    const registrationsByChapter = await db.execute(sql`
      SELECT 
        c.id as chapter_id,
        c.name as chapter_name,
        DATE(r.created_at) as date,
        COUNT(*) as registrations
      FROM ${registrations} r
      JOIN ${chapters} c ON r.chapter_id = c.id
      WHERE r.created_at >= ${formattedDate}
      GROUP BY c.id, c.name, DATE(r.created_at)
      ORDER BY date ASC, c.name ASC
    `)

    // Transform the result to the expected format
    const chapterColors = [
      { bg: "rgba(99, 102, 241, 0.5)", border: "rgb(99, 102, 241)" },
      { bg: "rgba(34, 197, 94, 0.5)", border: "rgb(34, 197, 94)" },
      { bg: "rgba(239, 68, 68, 0.5)", border: "rgb(239, 68, 68)" },
      { bg: "rgba(249, 115, 22, 0.5)", border: "rgb(249, 115, 22)" },
      { bg: "rgba(16, 185, 129, 0.5)", border: "rgb(16, 185, 129)" },
      { bg: "rgba(139, 92, 246, 0.5)", border: "rgb(139, 92, 246)" },
      { bg: "rgba(236, 72, 153, 0.5)", border: "rgb(236, 72, 153)" },
      { bg: "rgba(59, 130, 246, 0.5)", border: "rgb(59, 130, 246)" },
    ]

    // Create a map of chapter data
    const chapterData = allChapters.map((chapter, index) => {
      // Initialize registrations array with zeros for all dates
      const registrationsArray = Array(7).fill(0)

      // Fill in actual registration counts
      registrationsByChapter.rows.forEach((row: any) => {
        if (row.chapter_id === chapter.id) {
          const rowDate = new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          const dateIndex = dates.indexOf(rowDate)
          if (dateIndex !== -1) {
            registrationsArray[dateIndex] = Number(row.registrations)
          }
        }
      })

      return {
        name: chapter.name,
        registrations: registrationsArray,
        color: chapterColors[index % chapterColors.length],
      }
    })

    return NextResponse.json({
      dates,
      chapters: chapterData,
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
