"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileDown, Printer } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

// Print-specific styles
const printStyles = `
  @media print {
    @page {
      margin: 0.5in;
      size: A4;
    }
    
    body {
      background: white !important;
      color: black !important;
      font-size: 12px !important;
    }
    
    .print-hide {
      display: none !important;
    }
    
    .print-card {
      box-shadow: none !important;
      border: 2px solid #166534 !important;
      background: white !important;
      margin: 0 !important;
      page-break-inside: avoid;
    }
    
    .print-watermark {
      opacity: 0.03 !important;
      font-size: 6rem !important;
      font-weight: 900 !important;
    }
    
    .print-header {
      background: white !important;
      border-bottom: 2px solid #166534 !important;
      padding: 1rem !important;
    }
    
    .print-logo {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      height: 4rem !important;
      width: 4rem !important;
    }
    
    .print-content {
      page-break-inside: avoid;
      padding: 1rem !important;
    }
    
    .print-compact {
      margin-bottom: 0.5rem !important;
      padding: 0.5rem !important;
    }
    
    .print-title {
      font-size: 1.25rem !important;
      margin: 0.25rem 0 !important;
    }
    
    .print-badge {
      font-size: 0.75rem !important;
      padding: 0.25rem 0.5rem !important;
    }
    
    .print-photo {
      width: 6rem !important;
      height: 8rem !important;
    }
    
    .print-footer {
      border-top: 1px solid #ccc !important;
      padding-top: 0.5rem !important;
      margin-top: 1rem !important;
      font-size: 0.75rem !important;
    }
    
    /* Hide action buttons when printing */
    .print-buttons {
      display: none !important;
    }
  }
`

export type RegistrationDetails = {
  registrationNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  chapterName?: string
  schoolName?: string
  centerName?: string
  paymentStatus: string
  paymentReference: string
  createdAt: string
  passportUrl?: string
}

export function PaymentSuccessCard({ registration }: { registration: RegistrationDetails }) {
  const [downloading, setDownloading] = useState(false)

  // Inject print styles on component mount
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = printStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      window.location.href = `/api/registrations/${registration.registrationNumber}/slip`
    } catch (error) {
      console.error("Error downloading slip:", error)
    } finally {
      setTimeout(() => setDownloading(false), 1000)
    }
  }
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-8">      {/* Enhanced Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-45 select-none print-watermark">
        <div className="text-9xl font-extrabold text-gray-600 whitespace-nowrap">
          NAPPS2025
        </div>
      </div>

      {/* Top accent border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-yellow-500 to-green-600"></div>

      <Card className="border-0 shadow-2xl relative z-10 bg-white/95 backdrop-blur-sm max-w-4xl mx-auto print-card">
        <CardHeader className="text-center border-b border-gray-200 pb-8 bg-gradient-to-r from-green-50 to-yellow-50 print-header">
          {/* Logo Section */}
          <div className="flex justify-center mb-6">            <div className="relative">
              <img 
                src="https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749177946/napps-logo_c4jlmm.png" 
                alt="NAPPS Logo" 
                className="h-24 w-24 rounded-full border-4 border-green-600 shadow-lg bg-white p-1 print-logo" 
              />
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                NAPPS
              </div>
            </div>
          </div>
          
          {/* Header Text */}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-green-800">NAPPS NASARAWA</CardTitle>
            <p className="text-sm text-gray-600 font-medium">National Association of Proprietors of Private Schools</p>
            <div className="inline-block bg-green-700 text-white px-6 py-2 rounded-full text-sm font-semibold">
              UNIFIED EXAMINATION REGISTRATION SLIP
            </div>
            <CardDescription className="text-base font-medium text-gray-700">Academic Session: 2024/2025</CardDescription>
          </div>
          
          {/* Registration Number Badge */}
          <div className="mt-6 inline-flex items-center gap-2">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-mono font-bold text-lg">
              REG NO: {registration.registrationNumber}
            </div>
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              VERIFIED
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 print-content">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Student Information - Takes 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 print-compact">
                <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                  <div className="w-2 h-6 bg-green-600 mr-3 rounded"></div>
                  CANDIDATE INFORMATION
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-300 pb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Student Name</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {registration.firstName.toUpperCase()} {registration.middleName ? registration.middleName.toUpperCase() + " " : ""}
                        {registration.lastName.toUpperCase()}
                      </p>
                    </div>
                    
                    <div className="border-b border-gray-300 pb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Chapter</p>
                      <p className="font-semibold text-gray-900">{registration.chapterName || "N/A"}</p>
                    </div>
                    
                    <div className="border-b border-gray-300 pb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">School Name</p>
                      <p className="font-semibold text-gray-900">{(registration.schoolName || "N/A").toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border-b border-gray-300 pb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Examination Center</p>
                      <p className="font-semibold text-gray-900">{registration.centerName || "N/A"}</p>
                    </div>
                    
                    <div className="border-b border-gray-300 pb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Registration Date</p>
                      <p className="font-semibold text-gray-900">{formatDate(registration.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              {/* Student Passport Photo - Takes 1 column */}
            <div className="lg:col-span-1 flex justify-center">
              <div className="relative">
                <div className="border-4 border-gray-400 rounded-lg overflow-hidden w-36 h-48 bg-white shadow-lg print-photo">
                  <img 
                    src={registration.passportUrl || "/placeholder.svg"} 
                    alt="Student Passport" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded print-badge">
                  STUDENT PHOTO
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="mt-8 flex items-center justify-between bg-green-700 text-white p-6 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="bg-green-600 px-3 py-1 rounded text-sm font-semibold">
                PAID
              </div>
              <div>
                <p className="text-sm opacity-90">Examination Fee</p>
                <p className="text-xl font-bold">₦3,000.00</p>
              </div>
            </div>
            {registration.paymentReference && (
              <div className="text-right">
                <p className="text-sm opacity-90">Transaction ID</p>
                <p className="font-mono text-sm">{registration.paymentReference}</p>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-3">IMPORTANT INSTRUCTIONS:</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• Present this slip on examination day for verification</p>
              <p>• Arrive at the examination center 30 minutes before the scheduled time</p>
              <p>• Bring valid identification and writing materials</p>
            </div>
          </div>          {/* Verification Footer */}
          <div className="mt-6 text-center">
            <div className="border-t border-gray-300 pt-4 print-footer">
              <p className="text-sm text-gray-600 italic">For inquiries and verification, visit: www.portal.nappsnasarawa.com</p>
              <p className="text-sm font-semibold text-green-700 mt-1">NAPPS Nasarawa - Committed to Educational Excellence</p>
            </div>
          </div>
        </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 border-t border-gray-200 pt-6 bg-gray-50 print-buttons">
          <Button className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Registration Slip
          </Button>
          <Button 
            variant="default" 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleDownload}
            disabled={downloading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
          <Button variant="outline" className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-50" asChild>
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
