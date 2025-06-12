import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth" 
import { schools, registrations } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const db = getDbConnection()
    const coordinatorId = session.id!

    // Get unique schools from registrations made by this coordinator
    const coordinatorRegistrations = await db.query.registrations.findMany({
      where: eq(registrations.coordinatorRegisteredBy, coordinatorId),
      with: {
        school: true,
      },
    })

    // Extract unique schools (both from schoolId and schoolName)
    const schoolsMap = new Map()
    const schoolIds = new Set<number>()

    coordinatorRegistrations.forEach(reg => {
      if (reg.school) {
        schoolsMap.set(reg.school.id, {
          id: reg.school.id,
          name: reg.school.name,
          chapterId: reg.school.chapterId
        })
        schoolIds.add(reg.school.id)
      } else if (reg.schoolName && !reg.schoolId) {
        // For manual school names without schoolId, create a virtual entry
        const key = `manual_${reg.schoolName}`
        if (!schoolsMap.has(key)) {
          schoolsMap.set(key, {
            id: null,
            name: reg.schoolName,
            chapterId: reg.chapterId,
            isManual: true
          })
        }
      }
    })

    const uniqueSchools = Array.from(schoolsMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    )

    return NextResponse.json({
      schools: uniqueSchools
    })
  } catch (error) {
    console.error("Error fetching coordinator schools:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}
