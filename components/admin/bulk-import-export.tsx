"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Upload, Download, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Info, X, RefreshCw, FileText, Database
} from "lucide-react"

interface BulkImportExportProps {
  chapters: Array<{ id: number; name: string }>
  onSuccess?: () => void
}

type ImportResult = {
  successful: number
  failed: number
  errors: Array<{ row: number; error: string }>
}

export function BulkImportExport({ chapters, onSuccess }: BulkImportExportProps) {
  const { toast } = useToast()
  
  // Import states
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importChapter, setImportChapter] = useState("")
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  
  // Export states
  const [exportFormat, setExportFormat] = useState("csv")
  const [exportChapter, setExportChapter] = useState("all")
  const [exportDateFrom, setExportDateFrom] = useState("")
  const [exportDateTo, setExportDateTo] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  async function handleFileImport() {
    if (!importFile || !importChapter) {
      toast({
        title: "Missing Information",
        description: "Please select a file and chapter",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('chapterId', importChapter)

      const response = await fetch('/api/admin/registrations/bulk-import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()
      setImportResult(result)
      
      toast({
        title: "Import Completed",
        description: `Successfully imported ${result.successful} registrations with ${result.failed} failures`,
      })

      if (onSuccess) onSuccess()

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the file",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
      setImportProgress(100)
    }
  }

  async function handleExport() {
    setIsExporting(true)

    try {
      const params = new URLSearchParams({
        format: exportFormat,
        ...(exportChapter !== "all" && { chapterId: exportChapter }),
        ...(exportDateFrom && { dateFrom: exportDateFrom }),
        ...(exportDateTo && { dateTo: exportDateTo })
      })

      const response = await fetch(`/api/admin/registrations/bulk-export-advanced?${params}`)
      
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-export-${new Date().toISOString().split('T')[0]}.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Registration data has been exported successfully"
      })

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  async function downloadTemplate() {
    try {
      const response = await fetch('/api/admin/registrations/import-template')
      if (!response.ok) throw new Error('Template download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'registration-import-template.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Template Downloaded",
        description: "Import template has been downloaded"
      })

    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download import template",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Import
          </CardTitle>
          <CardDescription>
            Import student registrations from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Download Template</Label>
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={downloadTemplate}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div>
            <Label htmlFor="file">Select CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="chapter">Target Chapter</Label>
            <Select value={importChapter} onValueChange={setImportChapter}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id.toString()}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isImporting && (
            <div>
              <Label>Import Progress</Label>
              <Progress value={importProgress} className="mt-2" />
            </div>
          )}

          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button 
                className="w-full"
                disabled={!importFile || !importChapter || isImporting}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Bulk Import</DialogTitle>
                <DialogDescription>
                  Are you sure you want to import registrations from "{importFile?.name}" 
                  into {chapters.find(c => c.id.toString() === importChapter)?.name}?
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Important Notes:</p>
                  <ul className="text-orange-700 list-disc list-inside mt-1">
                    <li>Duplicate registrations will be skipped</li>
                    <li>Invalid data rows will be reported</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowImportDialog(false)
                  handleFileImport()
                }}>
                  Proceed with Import
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Import Results</span>
              </div>
              <div className="text-sm space-y-1">
                <p>✅ Successfully imported: {importResult.successful} registrations</p>
                <p>❌ Failed: {importResult.failed} registrations</p>
              </div>
              
              {importResult.errors.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-600 font-medium">
                    View Errors ({importResult.errors.length})
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 text-xs">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-red-600">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Export
          </CardTitle>
          <CardDescription>
            Export registration data with advanced filtering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV Format</SelectItem>
                <SelectItem value="xlsx">Excel Format</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exportChapter">Chapter Filter</Label>
            <Select value={exportChapter} onValueChange={setExportChapter}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id.toString()}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <Button 
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>CSV format is best for data manipulation</li>
              <li>Excel format preserves formatting</li>
              <li>PDF format is ideal for reports</li>
              <li>Use date filters for specific periods</li>
              <li>Large exports may take a few moments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
