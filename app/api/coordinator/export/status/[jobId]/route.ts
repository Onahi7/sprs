import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { jobStore } from "@/lib/export-job-store"

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await getSession()
    
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { jobId } = await params
    
    console.log(`Checking status for job: ${jobId}`)
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const job = jobStore.get(jobId)
    
    console.log(`Job found:`, job ? 'YES' : 'NO')
    
    if (!job) {
      console.log(`Available jobs count:`, jobStore.size())
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      downloadUrl: job.downloadUrl,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt
    })

  } catch (error) {
    console.error("Error checking job status:", error)
    return NextResponse.json(
      { error: "Failed to check job status" }, 
      { status: 500 }
    )
  }
}
