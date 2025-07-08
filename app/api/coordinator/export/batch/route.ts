import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { registrations, chapters, schools, centers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { generateRegistrationSlipPDF } from "@/lib/pdf"
import JSZip from "jszip"
import { jobStore, type ExportJob } from "@/lib/export-job-store"

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

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId, batchSize = 50, filters = {} } = await request.json()
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const coordinatorId = session.id!
    
    // Use chapterId from session to get all registrations for this chapter
    const chapterId = session.chapterId
    
    if (!chapterId) {
      return NextResponse.json({ error: "No chapter assigned to coordinator" }, { status: 400 })
    }
    
    const db = getDbConnection()

    // Build query conditions - use chapterId to include all registrations for this chapter
    const conditions = [eq(registrations.chapterId, chapterId)]
    
    if (filters.schoolId && filters.schoolId !== "all") {
      if (filters.schoolId.startsWith("manual_")) {
        const schoolName = filters.schoolId.replace("manual_", "")
        conditions.push(eq(registrations.schoolName, schoolName))
      } else {
        conditions.push(eq(registrations.schoolId, parseInt(filters.schoolId)))
      }
    }
    
    if (filters.centerId && filters.centerId !== "all") {
      conditions.push(eq(registrations.centerId, parseInt(filters.centerId)))
    }
    
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      conditions.push(eq(registrations.paymentStatus, filters.paymentStatus))
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    // Get total count
    const { count } = await import("drizzle-orm")
    const totalResult = await db.select({ count: count() }).from(registrations).where(whereClause)
    const totalItems = totalResult[0]?.count || 0

    if (totalItems === 0) {
      return NextResponse.json({ error: "No registrations found" }, { status: 404 })
    }

    // Initialize job
    console.log(`Creating job ${jobId} with ${totalItems} items`)
    jobStore.set(jobId, {
      id: jobId,
      status: "preparing",
      progress: 0,
      totalItems,
      processedItems: 0,
      createdAt: new Date(),
    })

    console.log(`Job ${jobId} created, starting background processing`)
    // Start background processing
    processExportJob(jobId, whereClause, batchSize)

    return NextResponse.json({ 
      success: true, 
      jobId, 
      totalItems,
      message: "Export job started. Check status endpoint for progress." 
    })

  } catch (error) {
    console.error("Error starting batch export:", error)
    return NextResponse.json(
      { error: "Failed to start export job" }, 
      { status: 500 }
    )
  }
}

async function processExportJob(
  jobId: string, 
  whereClause: any, 
  batchSize: number
) {
  const job = jobStore.get(jobId)
  if (!job) return

  try {
    jobStore.update(jobId, { status: "processing" })
    
    const db = getDbConnection()
    const zip = new JSZip()
    const today = new Date().toISOString().slice(0, 10)
    
    let processedItems = 0
    let offset = 0
    const schoolFolders = new Map<string, any>()

    while (processedItems < job.totalItems) {
      // Get batch of registrations
      const batch = await db.query.registrations.findMany({
        limit: batchSize,
        offset,
        where: whereClause,
        with: {
          chapter: true,
          school: true,
          center: true,
        },
        orderBy: [registrations.schoolName, registrations.lastName, registrations.firstName]
      })

      if (batch.length === 0) break

      // Process batch in parallel with concurrency limit
      const concurrencyLimit = 5 // Process 5 PDFs at a time
      for (let i = 0; i < batch.length; i += concurrencyLimit) {
        const chunk = batch.slice(i, i + concurrencyLimit)
        
        await Promise.allSettled(chunk.map(async (registration) => {
          try {
            // Only process completed registrations
            if (registration.paymentStatus !== "completed") {
              return
            }

            // Determine school folder
            const schoolName = registration.schoolName || registration.school?.name || "Unknown School"
            const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9\s]/g, '').trim()
            
            if (!schoolFolders.has(cleanSchoolName)) {
              schoolFolders.set(cleanSchoolName, zip.folder(cleanSchoolName))
            }
            const schoolFolder = schoolFolders.get(cleanSchoolName)

            // Pre-download and cache passport image if needed
            if (registration.passportUrl) {
              try {
                await downloadImageWithCache(registration.passportUrl)
              } catch (error) {
                console.warn(`Failed to cache image for ${registration.registrationNumber}:`, error)
              }
            }

            // Generate PDF with optimized image handling
            const registrationData = {
              ...registration,
              paymentStatus: registration.paymentStatus as "pending" | "completed"
            }

            const pdfBuffer = await generateRegistrationSlipPDF(registrationData)
            
            // Clean filename
            const studentName = `${registration.firstName}_${registration.lastName}`.replace(/[^a-zA-Z0-9]/g, '_')
            const fileName = `${registration.registrationNumber}_${studentName}.pdf`
            
            schoolFolder?.file(fileName, pdfBuffer)
            
          } catch (error) {
            console.error(`Error processing registration ${registration.registrationNumber}:`, error)
            // Continue with other registrations
          }
        }))

        // Update progress after each chunk
        processedItems = Math.min(processedItems + chunk.length, job.totalItems)
        jobStore.update(jobId, {
          processedItems,
          progress: (processedItems / job.totalItems) * 100
        })
      }

      offset += batchSize
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Generate final ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 } // Balanced compression
    })
    
    // In production, save to cloud storage (S3, etc.)
    // For now, create a temporary download URL
    const uint8Array = new Uint8Array(zipBuffer)
    const blob = new Blob([uint8Array], { type: "application/zip" })
    const downloadUrl = `data:application/zip;base64,${zipBuffer.toString('base64')}`
    
    jobStore.update(jobId, {
      status: "completed",
      progress: 100,
      downloadUrl
    })

    // Clear image cache for this job to free memory
    imageCache.clear()

  } catch (error) {
    console.error(`Error processing export job ${jobId}:`, error)
    jobStore.update(jobId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred"
    })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = jobStore.get(jobId)
    
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json(job)

  } catch (error) {
    console.error("Error checking job status:", error)
    return NextResponse.json(
      { error: "Failed to check job status" }, 
      { status: 500 }
    )
  }
}

// Cleanup old jobs (call this periodically)
export function cleanupOldJobs() {
  jobStore.cleanup()
}
