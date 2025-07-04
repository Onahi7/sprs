"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileSpreadsheet, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"

type ExportType = "csv" | "pdf-bulk" | "pdf-batch"
type ExportStatus = "idle" | "preparing" | "processing" | "completed" | "error"

interface ExportJob {
  id: string
  type: ExportType
  status: ExportStatus
  progress: number
  totalItems: number
  processedItems: number
  downloadUrl?: string
  errorMessage?: string
  createdAt: Date
}

interface ExportOptions {
  type: ExportType
  includeSlips: boolean
  batchSize: number
  schoolFilter?: string
  centerFilter?: string
  paymentFilter?: string
}

export function AdvancedExport() {
  const { toast } = useToast()
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    type: "csv",
    includeSlips: false,
    batchSize: 50,
  })

  // Start export process
  const startExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    
    const jobId = `export_${Date.now()}`
    const newJob: ExportJob = {
      id: jobId,
      type: exportOptions.type,
      status: "preparing",
      progress: 0,
      totalItems: 0,
      processedItems: 0,
      createdAt: new Date(),
    }

    setExportJobs(prev => [newJob, ...prev])

    try {
      if (exportOptions.type === "csv") {
        await handleCSVExport(jobId)
      } else if (exportOptions.type === "pdf-batch") {
        await handlePDFExport(jobId)
      } else if (exportOptions.type === "pdf-bulk") {
        await handleBulkDownload(jobId)
      }
    } catch (error) {
      console.error("Export error:", error)
      updateJobStatus(jobId, "error", error instanceof Error ? error.message : "Export failed")
    } finally {
      setIsExporting(false)
    }
  }

  // Handle CSV export (fast)
  const handleCSVExport = async (jobId: string) => {
    updateJobStatus(jobId, "processing")
    
    const queryParams = new URLSearchParams({
      export: "true",
      format: "csv",
      ...(exportOptions.schoolFilter && { schoolId: exportOptions.schoolFilter }),
      ...(exportOptions.centerFilter && { centerId: exportOptions.centerFilter }),
      ...(exportOptions.paymentFilter && { paymentStatus: exportOptions.paymentFilter }),
    })

    const response = await fetch(`/api/coordinator/register?${queryParams}`)
    
    if (!response.ok) {
      throw new Error("Failed to export CSV")
    }

    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    
    updateJobStatus(jobId, "completed", undefined, downloadUrl)
    
    // Auto-download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Complete",
      description: "CSV file has been downloaded successfully",
    })
  }

  // Handle PDF export (with batching and progress)
  const handlePDFExport = async (jobId: string) => {
    updateJobStatus(jobId, "processing")

    const queryParams = new URLSearchParams({
      format: "pdf-batch",
      batchSize: exportOptions.batchSize.toString(),
      ...(exportOptions.schoolFilter && { schoolId: exportOptions.schoolFilter }),
      ...(exportOptions.centerFilter && { centerId: exportOptions.centerFilter }),
      ...(exportOptions.paymentFilter && { paymentStatus: exportOptions.paymentFilter }),
    })

    // Start the batch export
    const response = await fetch(`/api/coordinator/export/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        batchSize: exportOptions.batchSize,
        filters: {
          schoolId: exportOptions.schoolFilter,
          centerId: exportOptions.centerFilter,
          paymentStatus: exportOptions.paymentFilter,
        }
      })
    })

    if (!response.ok) {
      throw new Error("Failed to start batch export")
    }

    const { totalItems } = await response.json()
    
    updateJob(jobId, (job) => ({
      ...job,
      totalItems,
      status: "processing" as ExportStatus
    }))

    // Poll for progress
    pollExportProgress(jobId)
  }

  // Handle bulk download (direct download, no background processing)
  const handleBulkDownload = async (jobId: string) => {
    updateJobStatus(jobId, "processing")

    const queryParams = new URLSearchParams({
      ...(exportOptions.schoolFilter && { schoolId: exportOptions.schoolFilter }),
      ...(exportOptions.centerFilter && { centerId: exportOptions.centerFilter }),
      ...(exportOptions.paymentFilter && { paymentStatus: exportOptions.paymentFilter }),
    })

    const response = await fetch(`/api/coordinator/registrations/bulk-download?${queryParams}`)
    
    if (!response.ok) {
      throw new Error("Failed to download bulk files")
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `registration-slips-${new Date().toISOString().slice(0, 10)}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    updateJobStatus(jobId, "completed", undefined, url)
    
    toast({
      title: "Download Complete",
      description: "Registration slips downloaded successfully",
    })
  }

  // Poll export progress
  const pollExportProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/coordinator/export/status/${jobId}`)
        
        if (!response.ok) {
          clearInterval(pollInterval)
          updateJobStatus(jobId, "error", "Failed to check export status")
          return
        }

        const status = await response.json()
        
        updateJob(jobId, (job) => ({
          ...job,
          status: status.status,
          progress: status.progress,
          processedItems: status.processedItems,
          totalItems: status.totalItems,
          downloadUrl: status.downloadUrl,
          errorMessage: status.errorMessage,
        }))

        if (status.status === "completed" || status.status === "error") {
          clearInterval(pollInterval)
          
          if (status.status === "completed" && status.downloadUrl) {
            toast({
              title: "Export Complete",
              description: "PDF files are ready for download",
            })
          }
        }
      } catch (error) {
        clearInterval(pollInterval)
        updateJobStatus(jobId, "error", "Failed to check export status")
      }
    }, 2000) // Poll every 2 seconds
  }

  // Update job status
  const updateJobStatus = (
    jobId: string, 
    status: ExportStatus, 
    errorMessage?: string, 
    downloadUrl?: string
  ) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { 
            ...job, 
            status, 
            progress: status === "completed" ? 100 : job.progress,
            errorMessage,
            downloadUrl 
          }
        : job
    ))
  }

  // Update job with custom updater
  const updateJob = (jobId: string, updater: (job: ExportJob) => ExportJob) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? updater(job) : job
    ))
  }

  // Download completed export
  const downloadExport = (job: ExportJob) => {
    if (!job.downloadUrl) return

    const link = document.createElement('a')
    link.href = job.downloadUrl
    link.download = `${job.type}-export-${job.id}.${job.type === 'csv' ? 'csv' : 'zip'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clear completed jobs
  const clearCompletedJobs = () => {
    setExportJobs(prev => prev.filter(job => 
      job.status !== "completed" && job.status !== "error"
    ))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Export Options</CardTitle>
          <CardDescription>
            Export registrations with optimized performance for large datasets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`cursor-pointer transition-all ${
              exportOptions.type === "csv" 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:bg-muted/50"
            }`} onClick={() => setExportOptions(prev => ({ ...prev, type: "csv" }))}>
              <CardContent className="p-4 text-center">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">CSV Export</h3>
                <p className="text-sm text-muted-foreground">
                  Fast data export for analysis
                </p>
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ~1-5 seconds
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${
              exportOptions.type === "pdf-bulk" 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:bg-muted/50"
            }`} onClick={() => setExportOptions(prev => ({ ...prev, type: "pdf-bulk" }))}>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">PDF Bulk</h3>
                <p className="text-sm text-muted-foreground">
                  All slips in one ZIP file
                </p>
                <div className="mt-2 text-xs text-orange-600 font-medium">
                  ~2-10 minutes
                </div>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${
              exportOptions.type === "pdf-batch" 
                ? "ring-2 ring-primary bg-primary/5" 
                : "hover:bg-muted/50"
            }`} onClick={() => setExportOptions(prev => ({ ...prev, type: "pdf-batch" }))}>
              <CardContent className="p-4 text-center">
                <Download className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">PDF Batched</h3>
                <p className="text-sm text-muted-foreground">
                  Background processing with progress
                </p>
                <div className="mt-2 text-xs text-purple-600 font-medium">
                  Background job
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Options for PDF exports */}
          {(exportOptions.type === "pdf-bulk" || exportOptions.type === "pdf-batch") && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold">PDF Export Options</h4>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeSlips"
                  checked={exportOptions.includeSlips}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeSlips: !!checked }))
                  }
                />
                <label htmlFor="includeSlips" className="text-sm">
                  Include registration slips (slower but complete)
                </label>
              </div>

              {exportOptions.type === "pdf-batch" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Size</label>
                  <Select 
                    value={exportOptions.batchSize.toString()} 
                    onValueChange={(value) => 
                      setExportOptions(prev => ({ ...prev, batchSize: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 per batch</SelectItem>
                      <SelectItem value="50">50 per batch</SelectItem>
                      <SelectItem value="100">100 per batch</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Smaller batches = more frequent progress updates
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Performance Warning */}
          {exportOptions.type !== "csv" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                PDF exports with passport photos may take several minutes for large datasets. 
                Consider using CSV export for quick data analysis.
              </AlertDescription>
            </Alert>
          )}

          {/* Start Export Button */}
          <Button 
            onClick={startExport} 
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Starting Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start {exportOptions.type.toUpperCase()} Export
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Export Jobs Status */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Export Jobs</CardTitle>
              <CardDescription>Track your export progress</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCompletedJobs}
            >
              Clear Completed
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.status === "completed" && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {job.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    {(job.status === "processing" || job.status === "preparing") && (
                      <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                    )}
                    
                    <div>
                      <div className="font-medium">
                        {job.type.toUpperCase()} Export
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started {job.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">
                      {job.status}
                    </div>
                    {job.totalItems > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {job.processedItems}/{job.totalItems} items
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === "processing" && job.totalItems > 0 && (
                  <div className="space-y-1">
                    <Progress value={job.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {job.progress.toFixed(1)}% complete
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {job.status === "error" && job.errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{job.errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Download Button */}
                {job.status === "completed" && job.downloadUrl && (
                  <Button 
                    onClick={() => downloadExport(job)}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Export
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
