import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, schools } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
    
    // Get the 5 most recent registrations across all chapters
    const recentRegistrations = await db.query.registrations.findMany({
      limit: 5,
      orderBy: [desc(registrations.createdAt)],
      with: {
        chapter: {
          columns: {
            name: true,
          },
        },
        school: {
          columns: {
            name: true,
          },
        },
      },
    })

    const formattedRegistrations = recentRegistrations.map((registration) => {
      const createdAtDate = registration.createdAt ? new Date(registration.createdAt) : new Date();
      return {
        id: registration.id,
        studentName: `${registration.firstName} ${registration.lastName}`,
        chapterName: registration.chapter?.name || `Chapter ${registration.chapterId}`,
        schoolName: registration.schoolName || registration.school?.name || `School ${registration.schoolId}`,
        paymentStatus: registration.paymentStatus,
        createdAt: registration.createdAt,
        timeAgo: getTimeAgo(createdAtDate),
      }
    })

    return NextResponse.json(formattedRegistrations)
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json({ error: "Failed to fetch recent activity" }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else {
    return `${diffInDays} days ago`
  }
}
