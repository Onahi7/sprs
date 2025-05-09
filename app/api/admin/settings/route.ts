import { NextResponse } from "next/server"
import { db } from "@/db"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const allSettings = await db.query.settings.findMany()

    // Convert to key-value object
    const settingsObject = allSettings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>,
    )

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updatedSettings = await request.json()

    // Update each setting
    for (const [key, value] of Object.entries(updatedSettings)) {
      // Check if setting exists
      const existingSetting = await db.query.settings.findFirst({
        where: eq(settings.key, key),
      })

      if (existingSetting) {
        // Update existing setting
        await db
          .update(settings)
          .set({ value: value as string })
          .where(eq(settings.key, key))
      } else {
        // Create new setting
        await db.insert(settings).values({
          key,
          value: value as string,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
