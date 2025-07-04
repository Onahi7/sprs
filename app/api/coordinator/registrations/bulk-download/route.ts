import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { generateRegistrationSlipPDF } from "@/lib/pdf"
import JSZip from "jszip"

// Image cache to avoid re-downloading the same passport photos
const imageCache = new Map<string, Buffer>()

async function downloadImageWithCache(url: string): Promise<Buffer> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Cache the image (limit cache size to prevent memory issues)
    if (imageCache.size < 1000) { // Max 1000 cached images
      imageCache.set(url, buffer)
    }
    
    return buffer
  } catch (error) {
    console.error('Error downloading image:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const schoolFilter = searchParams.get("schoolId")
    const centerFilter = searchParams.get("centerId")
    const paymentFilter = searchParams.get("paymentStatus")
    
    const coordinatorId = session.id!
    const db = getDbConnection()

    // Build query conditions
    const whereConditions = [
      eq(registrations.coordinatorRegisteredBy, coordinatorId)
    ]
    
    // Add payment status filter (default to completed if not specified)
    if (paymentFilter && paymentFilter !== "all") {
      whereConditions.push(eq(registrations.paymentStatus, paymentFilter as "pending" | "completed"))
    } else {
      whereConditions.push(eq(registrations.paymentStatus, "completed"))
    }
    
    if (schoolFilter && schoolFilter !== "all") {
      if (schoolFilter.startsWith("manual_")) {
        const schoolName = schoolFilter.replace("manual_", "")
        whereConditions.push(eq(registrations.schoolName, schoolName))
      } else {
        whereConditions.push(eq(registrations.schoolId, parseInt(schoolFilter)))
      }
    }
    
    if (centerFilter && centerFilter !== "all") {
      whereConditions.push(eq(registrations.centerId, parseInt(centerFilter)))
    }

    // Get all registrations for this coordinator
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
      return NextResponse.json({ error: "No registrations found" }, { status: 404 })
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
    
    // Process each school with concurrency control
    for (const [schoolName, schoolRegistrations] of Object.entries(groupedBySchool)) {
      const schoolFolder = zip.folder(schoolName)
      
      if (!schoolFolder) continue

      // Process registrations in batches to avoid memory overload
      const batchSize = 10
      for (let i = 0; i < schoolRegistrations.length; i += batchSize) {
        const batch = schoolRegistrations.slice(i, i + batchSize)
        
        // Process batch in parallel with limited concurrency
        await Promise.allSettled(batch.map(async (registration) => {
          try {
            // Pre-download and cache passport image if needed
            if (registration.passportUrl) {
              try {
                await downloadImageWithCache(registration.passportUrl)
              } catch (error) {
                console.warn(`Failed to cache image for ${registration.registrationNumber}:`, error)
              }
            }

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
        }))
        
        // Small delay between batches to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 } // Balanced compression
    })
    
    // Clear image cache to free memory
    imageCache.clear()
    
    // Set response headers
    const chapterName = allRegistrations[0]?.chapter?.name || "Chapter"
    const cleanChapterName = chapterName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const today = new Date().toISOString().slice(0, 10)
    
    let filename = `${cleanChapterName}_Registration_Slips_${today}.zip`
    
    if (schoolFilter && schoolFilter !== "all") {
      const schoolName = schoolFilter.startsWith("manual_") 
        ? schoolFilter.replace("manual_", "")
        : Object.keys(groupedBySchool)[0] || "School"
      filename = `${cleanChapterName}_${schoolName.replace(/[^a-zA-Z0-9\s]/g, '_')}_Registration_Slips_${today}.zip`
    }

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
