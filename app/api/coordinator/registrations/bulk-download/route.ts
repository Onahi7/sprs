import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { generateRegistrationSlipPDF } from "@/lib/pdf"
import JSZip from "jszip"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolFilter = searchParams.get("schoolId") // Optional: filter by specific school
    
    const chapterId = session.chapterId
    if (!chapterId) {
      return NextResponse.json({ error: "No chapter assigned to coordinator" }, { status: 400 })
    }

    const db = getDbConnection()

    // Build query conditions
    const whereConditions = [
      eq(registrations.chapterId, chapterId),
      eq(registrations.paymentStatus, "completed") // Only download completed registrations
    ]
    
    if (schoolFilter && schoolFilter !== "all") {
      whereConditions.push(eq(registrations.schoolId, parseInt(schoolFilter)))
    }

    // Get all completed registrations for this coordinator's chapter
    const allRegistrations = await db.query.registrations.findMany({
      where: and(...whereConditions),
      with: {
        chapter: true,
        school: true,
        center: true,
      },
      orderBy: [registrations.schoolName, registrations.lastName, registrations.firstName]
    })

    if (allRegistrations.length === 0) {
      return NextResponse.json({ error: "No completed registrations found" }, { status: 404 })
    }

    // Group registrations by school
    const groupedBySchool = allRegistrations.reduce((acc, registration) => {
      const schoolName = registration.schoolName || registration.school?.name || "Unknown School"
      const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
      
      if (!acc[cleanSchoolName]) {
        acc[cleanSchoolName] = []
      }
      acc[cleanSchoolName].push(registration)
      return acc
    }, {} as Record<string, typeof allRegistrations>)

    // Create ZIP file
    const zip = new JSZip()
    const today = new Date().toISOString().slice(0, 10)
    
    // Process each school
    for (const [schoolName, schoolRegistrations] of Object.entries(groupedBySchool)) {
      const schoolFolder = zip.folder(schoolName)
      
      if (!schoolFolder) continue

      // Generate PDF for each registration in this school
      for (const registration of schoolRegistrations) {
        try {
          // Ensure we have valid data for PDF generation
          const registrationData = {
            ...registration,
            paymentStatus: registration.paymentStatus as "pending" | "completed"
          }

          const pdfBuffer = await generateRegistrationSlipPDF(registrationData)
          
          // Clean filename
          const studentName = `${registration.firstName}_${registration.lastName}`.replace(/[^a-zA-Z0-9]/g, '_')
          const fileName = `${registration.registrationNumber}_${studentName}.pdf`
          
          schoolFolder.file(fileName, pdfBuffer)
        } catch (error) {
          console.error(`Error generating PDF for registration ${registration.registrationNumber}:`, error)
          // Continue with other registrations even if one fails
        }
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    
    // Set response headers
    const chapterName = allRegistrations[0]?.chapter?.name || "Chapter"
    const cleanChapterName = chapterName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const filename = schoolFilter && schoolFilter !== "all" 
      ? `${cleanChapterName}_${Object.keys(groupedBySchool)[0]}_Registration_Slips_${today}.zip`
      : `${cleanChapterName}_All_Schools_Registration_Slips_${today}.zip`

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("Error generating bulk registration slips:", error)
    return NextResponse.json(
      { error: "Failed to generate registration slips" }, 
      { status: 500 }
    )
  }
}
