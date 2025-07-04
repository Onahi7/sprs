// Shared job store for export operations
// In production, this should be replaced with Redis or a database

export interface ExportJob {
  id: string
  status: "preparing" | "processing" | "completed" | "error"
  progress: number
  totalItems: number
  processedItems: number
  downloadUrl?: string
  errorMessage?: string
  createdAt: Date
}

// In-memory job store (in production, use Redis or database)
const exportJobs = new Map<string, ExportJob>()

export const jobStore = {
  set: (jobId: string, job: ExportJob) => {
    exportJobs.set(jobId, job)
  },
  
  get: (jobId: string): ExportJob | undefined => {
    return exportJobs.get(jobId)
  },
  
  update: (jobId: string, updates: Partial<ExportJob>) => {
    const existingJob = exportJobs.get(jobId)
    if (existingJob) {
      exportJobs.set(jobId, { ...existingJob, ...updates })
    }
  },
  
  delete: (jobId: string) => {
    exportJobs.delete(jobId)
  },
  
  cleanup: () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    for (const [jobId, job] of exportJobs.entries()) {
      if (job.createdAt < oneDayAgo) {
        exportJobs.delete(jobId)
      }
    }
  },
  
  size: () => exportJobs.size
}
