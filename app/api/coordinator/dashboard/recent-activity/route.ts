import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, schools } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const chapterId = parseInt(searchParams.get("chapterId") || session.chapterId?.toString() || "0", 10)
    
    // Verify the coordinator has access to this chapter
    if (session.chapterId !== chapterId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const db = getDbConnection()
    
    // Get the 4 most recent registrations for this chapter
    const recentRegistrations = await db.query.registrations.findMany({
      limit: 4,
      where: eq(registrations.chapterId, chapterId),
      orderBy: [desc(registrations.createdAt)],
      with: {
        school: {
          columns: {
            name: true,
          },
        },
      },
    })

    const formattedRegistrations = recentRegistrations.map((registration) => ({
      id: registration.id,
      studentName: `${registration.firstName} ${registration.lastName}`,
      schoolName: registration.schoolName || registration.school?.name || `School ${registration.schoolId}`,
      paymentStatus: registration.paymentStatus,
      createdAt: registration.createdAt,
      timeAgo: getTimeAgo(new Date(registration.createdAt)),
    }))

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
