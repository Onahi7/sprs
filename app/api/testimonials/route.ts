import { NextResponse } from "next/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    // In a real implementation, you would have a testimonials table
    // For now, we'll check if testimonials are stored in settings
    const testimonialsSetting = await db.query.settings.findFirst({
      where: eq(settings.key, "testimonials"),
    })

    if (testimonialsSetting?.value) {
      try {
        const testimonials = JSON.parse(testimonialsSetting.value)
        return NextResponse.json(testimonials)
      } catch (e) {
        console.error("Error parsing testimonials JSON:", e)
      }
    }

    // Return empty array if no testimonials found
    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 })
  }
}
