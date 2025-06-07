"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { FileIcon, Upload, Download, AlertCircle, CheckCircle, FileUp, FileDown, Loader2 } from "lucide-react"
import { SlotBalanceDisplay } from "@/components/coordinator/slot-balance-display"

export function BulkRegistrationForm() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    totalRecords: number
    validRecords: number
    invalidRecords: number
    errors?: Array<{ row: number; message: string }>
    slotRequired: number
  } | null>(null)
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    registered: number
    failed: number
    registrationNumbers: string[]
    remainingSlots: number
  } | null>(null)

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/coordinator/register/bulk-template')
      if (!response.ok) {
        throw new Error('Failed to download template')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bulk-registration-template.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Template Downloaded",
        description: "CSV template has been downloaded successfully. Please fill it and upload."
      })
    } catch (error) {
      console.error('Error downloading template:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download CSV template.",
        variant: "destructive"
      })
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV file",
          variant: "destructive"
        })
        return
      }
      
      setFile(selectedFile)
      setValidationResult(null)
      setSubmissionResult(null)
    }
  }

  // Validate the uploaded CSV file
  const validateFile = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      })
      return
    }

    setValidating(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/coordinator/register/bulk-validate', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Validation failed')
      }
      
      setValidationResult(result)
      
      if (result.isValid && result.validRecords > 0) {
        toast({
          title: "Validation Successful",
          description: `${result.validRecords} of ${result.totalRecords} records are valid and ready for registration.`
        })
      } else if (result.validRecords === 0) {
        toast({
          title: "Validation Failed",
          description: "No valid records found in the CSV file. Please check the format and try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Validation Completed with Errors",
          description: `${result.validRecords} of ${result.totalRecords} records are valid. ${result.invalidRecords} records have errors.`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error validating file:', error)
      toast({
        title: "Validation Failed",
        description: error instanceof Error ? error.message : "Failed to validate CSV file",
        variant: "destructive"
      })
    } finally {
      setValidating(false)
    }
  }

  // Submit the validated file for bulk registration
  const handleSubmit = async () => {
    if (!file || !validationResult || !validationResult.isValid) {
      toast({
        title: "Cannot Proceed",
        description: "Please upload and validate a CSV file first",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    setProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Create progress tracking with simulated progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)
      
      const response = await fetch('/api/coordinator/register/bulk', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }
      
      setSubmissionResult(result)
      
      toast({
        title: "Bulk Registration Successful",
        description: `Successfully registered ${result.registered} students. Slots remaining: ${result.remainingSlots}`
      })
      
      // Reset form state after successful submission
      setFile(null)
      setValidationResult(null)
      
      // Reset file input
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (error) {
      console.error('Error processing bulk registration:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to process bulk registration",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  // Download all registration slips as a ZIP file
  const downloadAllSlips = async () => {
    if (!submissionResult || !submissionResult.registrationNumbers.length) {
      toast({
        title: "No Registrations",
        description: "There are no successful registrations to download slips for",
        variant: "destructive"
      })
      return
    }
    
    try {
      const response = await fetch(`/api/coordinator/register/bulk-slips?registrations=${submissionResult.registrationNumbers.join(',')}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate registration slips')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registration-slips-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Registration Slips Downloaded",
        description: `Downloaded ${submissionResult.registrationNumbers.length} registration slips as a ZIP file.`
      })
    } catch (error) {
      console.error('Error downloading registration slips:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download registration slips",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Slot Balance Display */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <SlotBalanceDisplay />
        </div>
      </div>
      
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Bulk Registration Process:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Download the CSV template and fill in student details</li>
            <li>• Upload and validate the CSV file</li>
            <li>• Each valid student record will use 1 slot from your balance</li>
            <li>• After successful registration, download all registration slips as a ZIP file</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Bulk Student Registration</CardTitle>
          <CardDescription>
            Register multiple students at once by uploading a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 1: Download CSV Template</h3>
            <Button 
              onClick={handleDownloadTemplate} 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Download CSV Template
            </Button>
          </div>
          
          <Separator />
          
          {/* Step 2: Upload and Validate CSV */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Step 2: Upload and Validate CSV</h3>
            
            <div className="grid w-full items-center gap-1.5">
              <label 
                htmlFor="csv-upload" 
                className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-all"
              >
                <FileUp className="w-8 h-8 text-gray-400 mb-2" />
                <div className="text-sm text-center">
                  <span className="font-medium">Click to upload</span> or drag and drop
                  <p className="text-xs text-gray-500 mt-1">CSV file (max 1MB)</p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading || validating || processing}
                />
              </label>
              
              {file && (
                <div className="flex items-center gap-2 text-sm mt-2 p-2 bg-gray-50 rounded">
                  <FileIcon className="h-4 w-4" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
              
              <Button 
                onClick={validateFile} 
                disabled={!file || uploading || validating || processing}
                className="mt-2"
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Validate CSV File
                  </>
                )}
              </Button>
            </div>
            
            {validationResult && (
              <div className={`mt-4 p-4 rounded-md ${
                validationResult.isValid 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-start">
                  {validationResult.isValid 
                    ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    : <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                  }
                  <div>
                    <h4 className="font-medium">
                      {validationResult.isValid 
                        ? 'CSV Validation Successful' 
                        : 'CSV Validation Completed with Errors'
                      }
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Total Records: {validationResult.totalRecords}</li>
                      <li>Valid Records: {validationResult.validRecords}</li>
                      <li>Invalid Records: {validationResult.invalidRecords}</li>
                      <li>Slots Required: {validationResult.slotRequired}</li>
                    </ul>
                    
                    {validationResult.errors && validationResult.errors.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium">Errors:</h5>
                        <div className="mt-1 max-h-32 overflow-y-auto text-xs">
                          {validationResult.errors.slice(0, 5).map((error, index) => (
                            <div key={index} className="py-1">
                              <span className="font-mono">Row {error.row}:</span> {error.message}
                            </div>
                          ))}
                          {validationResult.errors.length > 5 && (
                            <div className="py-1 text-gray-500">
                              ... and {validationResult.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Step 3: Process Registration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Step 3: Process Registration</h3>
            
            <Button 
              onClick={handleSubmit}
              disabled={
                !file || 
                !validationResult || 
                !validationResult.isValid || 
                validationResult.validRecords === 0 ||
                processing
              }
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Register {validationResult?.validRecords || 0} Students
                </>
              )}
            </Button>
            
            {processing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  Processing {Math.floor(progress)}%
                </p>
              </div>
            )}
            
            {submissionResult && (
              <div className={`mt-4 p-4 rounded-md ${
                submissionResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {submissionResult.success 
                    ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    : <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                  }
                  <div>
                    <h4 className="font-medium">
                      {submissionResult.success 
                        ? 'Bulk Registration Complete' 
                        : 'Registration Failed'
                      }
                    </h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Successfully Registered: {submissionResult.registered}</li>
                      {submissionResult.failed > 0 && (
                        <li>Failed: {submissionResult.failed}</li>
                      )}
                      <li>Slots Remaining: {submissionResult.remainingSlots}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {submissionResult && submissionResult.success && submissionResult.registrationNumbers.length > 0 && (
            <Button 
              onClick={downloadAllSlips}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download All Registration Slips
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
