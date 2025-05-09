import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from "@/db"
import { chapters, registrations, chapterCoordinators } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateRegistrationNumber(chapterId: number): Promise<string> {
  // Get the chapter code
  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chapterId),
  })

  if (!chapter) {
    throw new Error("Chapter not found")
  }

  // Get the current year
  const currentYear = new Date().getFullYear().toString().slice(-2)

  // Get the split code or use a default
  const splitCode = chapter.splitCode || "00"

  // Get the count of registrations for this chapter and increment by 1
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(eq(registrations.chapterId, chapterId))

  const count = result[0].count + 1

  // Format the count as a 4-digit number with leading zeros
  const formattedCount = count.toString().padStart(4, "0")

  // Combine all parts to create the registration number
  // Format: SPRS-YY-CHAPTERID-SPLITCODE-XXXX
  const registrationNumber = `SPRS-${currentYear}-${chapterId}-${splitCode}-${formattedCount}`

  return registrationNumber
}

export async function generateUniqueCode(): Promise<string> {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let code = ""
  let isUnique = false

  while (!isUnique) {
    // Generate 8-character random alphanumeric code
    code = ""
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Check if code already exists
    const existingCoordinator = await db.query.chapterCoordinators.findFirst({
      where: eq(chapterCoordinators.uniqueCode, code),
    })

    if (!existingCoordinator) {
      isUnique = true
    }
  }

  return code
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj)
}
