"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, Download, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function ResultSlipPage() {
  const params = useParams()
  const router = useRouter()
  const registrationNumber = params.registrationNumber as string
  
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [centerPosition, setCenterPosition] = useState<number>(0)

  useEffect(() => {
    fetchResults()
  }, [registrationNumber])
  const fetchResults = async () => {
    try {
      // Fetch registration details
      const registrationResponse = await fetch(`/api/registrations/${registrationNumber}`)
      if (!registrationResponse.ok) throw new Error("Registration not found")
      
      const registration = await registrationResponse.json()
      
      // Fetch results
      const resultsResponse = await fetch(`/api/results?registrationNumber=${registrationNumber}`)
      if (!resultsResponse.ok) throw new Error("Results not found")
      
      const studentResults = await resultsResponse.json()
      
      // Fetch center position (ranking within center)
      await calculateCenterPosition(registration.centerId, studentResults)
      
      // Process results
      const processedResults = processStudentResults(studentResults, registration)
      setResults(processedResults)
      
    } catch (error) {
      console.error("Error fetching results:", error)
      setError("Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  const calculateCenterPosition = async (centerId: number, currentResults: any[]) => {
    try {
      // Fetch all results for the center to calculate position
      const centerResultsResponse = await fetch(`/api/results?centerId=${centerId}`)
      if (centerResultsResponse.ok) {
        const allCenterResults = await centerResultsResponse.json()
        
        // Group by student and calculate total scores
        const studentTotals: { [key: string]: number } = {}
        
        allCenterResults.forEach((result: any) => {
          const regNumber = result.registration.registrationNumber
          if (!studentTotals[regNumber]) {
            studentTotals[regNumber] = 0
          }
          studentTotals[regNumber] += result.score
        })
        
        // Calculate current student's total
        const currentTotal = currentResults.reduce((sum, result) => sum + result.score, 0)
        
        // Sort and find position
        const sortedTotals = Object.values(studentTotals).sort((a, b) => b - a)
        const position = sortedTotals.findIndex(total => total <= currentTotal) + 1
        
        setCenterPosition(position)
      }
    } catch (error) {
      console.warn("Could not calculate center position:", error)
      setCenterPosition(0)
    }
  }

  const processStudentResults = (studentResults: any[], registration: any) => {
    const resultsBySubject = studentResults.reduce((acc: any, result: any) => {
      acc[result.subject.id] = result
      return acc
    }, {})

    const totalScore = studentResults.reduce((sum, result) => sum + result.score, 0)
    const totalMaxScore = studentResults.reduce((sum, result) => sum + result.subject.maxScore, 0)
    const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

    return {
      student: {
        registrationNumber: registration.registrationNumber,
        firstName: registration.firstName,
        lastName: registration.lastName,
        middleName: registration.middleName,
        class: registration.class,
        centerName: registration.centerName,
        chapterName: registration.chapterName,
        schoolName: registration.schoolName,
        passportUrl: registration.passportUrl
      },
      subjects: studentResults.map(result => result.subject),
      results: resultsBySubject,
      totalScore,
      totalMaxScore,
      averagePercentage
    }
  }

  const handlePrint = async () => {
    try {
      // Call the PDF generation API and open it for printing
      const response = await fetch(`/api/student/results/${registrationNumber}/slip`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      // Get the PDF blob
      const blob = await response.blob()
      
      // Create object URL and open in new window for printing
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          // Clean up the object URL after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
            printWindow.close()
          }, 1000)
        }
      } else {
        // Fallback: trigger download if popup blocked
        const a = document.createElement('a')
        a.href = url
        a.download = `result-slip-${registrationNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
    } catch (error) {
      console.error('Error generating PDF for print:', error)
      // Fallback to browser print
      window.print()
    }
  }  
  const handleDownload = async () => {
    try {
      // Call the PDF generation API
      const response = await fetch(`/api/student/results/${registrationNumber}/slip`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }
      
      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `result-slip-${registrationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
      // Fallback to print
      handlePrint()
    }
  }

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Results not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print/Download Controls - Hidden in print */}
      <div className="print:hidden bg-gray-50 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Results
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>      {/* Result Slip - Professional Format Matching PDF */}
      <div className="min-h-screen bg-white print:min-h-0">
        <div className="max-w-4xl mx-auto p-8 print:p-6">
          
          {/* Professional Card Container with Shadow */}
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-8 mx-auto max-w-3xl">
            
            {/* Watermark Background */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="text-gray-100 text-6xl font-bold transform -rotate-45 select-none opacity-30"
                  style={{ fontSize: '4rem' }}
                >
                  NAPPS Nasarawa State
                </div>
              </div>
              
              {/* Header Section */}
              <div className="relative z-10 mb-8">
                <div className="flex items-start justify-between mb-6">
                  {/* Left: Logo */}
                  <div className="flex items-center">
                    <div className="w-20 h-20 mr-6 rounded-full border-4 border-green-600 p-1 bg-white">
                      <Image
                        src="https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png"
                        alt="NAPPS Logo"
                        width={80}
                        height={80}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          // Fallback to placeholder
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-logo.svg";
                        }}
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-black leading-tight">
                        NAPPS NASARAWA STATE CHAPTER
                      </h1>
                      <p className="text-sm text-gray-700 mt-1">
                        Besides SALAMATU Hall Lafia, Jos Road
                      </p>
                      <p className="text-sm text-gray-700">
                        Napps Nasarawa State Unified Certificate Examination
                      </p>
                      <p className="text-xs text-gray-600 mt-1">(NNSUCE-2025)</p>
                    </div>
                  </div>
                  
                  {/* Right: Exam Date */}
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">Exam Date: 12/07/2025</p>
                  </div>
                </div>
                
                {/* Result Slip Header Bar */}
                <div className="bg-green-700 text-white text-center py-3 rounded-md mb-6">
                  <h2 className="text-lg font-bold">RESULT SLIP</h2>
                </div>
              </div>

              {/* Candidate Details Section */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-black mb-4">Candidate Details</h3>
                
                <div className="flex">
                  {/* Left: Student Information */}
                  <div className="flex-1 space-y-4">
                    <div className="flex">
                      <span className="font-bold w-48 text-black">Student Name:</span>
                      <span className="font-bold text-gray-800">
                        {results.student.firstName?.toUpperCase()} {results.student.lastName?.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-bold w-48 text-black">Registration Number:</span>
                      <span className="font-normal text-gray-700">
                        {results.student.registrationNumber}
                      </span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-bold w-48 text-black">Center Name:</span>
                      <span className="font-normal text-gray-700">
                        {results.student.centerName}
                      </span>
                    </div>
                    
                    <div className="flex">
                      <span className="font-bold w-48 text-black">School Name:</span>
                      <span className="font-normal text-gray-700">
                        {results.student.schoolName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Right: Student Photo */}
                  <div className="ml-8">
                    <div className="w-32 h-40 border-2 border-gray-300 bg-green-100 rounded-lg overflow-hidden shadow-md">
                      {results.student.passportUrl ? (
                        <Image 
                          src={results.student.passportUrl} 
                          alt="Student Photo"
                          width={128}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-green-100 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Results Table */}
              <div className="mb-8">
                <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
                  <thead>
                    <tr>
                      <th className="bg-green-700 text-white border border-gray-300 p-4 text-left text-lg font-bold">
                        SUBJECT
                      </th>
                      <th className="bg-green-700 text-white border border-gray-300 p-4 text-center text-lg font-bold">
                        SCORE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.subjects.map((subject: any, index: number) => {
                      const result = results.results[subject.id]
                      
                      return (
                        <tr key={subject.id} className={index === 1 ? "bg-yellow-100" : index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="border border-gray-300 p-4 font-medium text-black text-lg">
                            {subject.name}
                          </td>
                          <td className="border border-gray-300 p-4 text-center font-bold text-xl text-black">
                            {result.score}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Professional Summary Boxes */}
              <div className="flex justify-between items-center mb-8">
                <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-400 px-6 py-2">
                    <span className="font-bold text-black text-sm">TOTAL</span>
                  </div>
                  <div className="px-6 py-3 bg-white">
                    <span className="font-bold text-2xl text-black">{results.totalScore}</span>
                  </div>
                </div>
                
                {centerPosition > 0 && (
                  <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-400 px-6 py-2">
                      <span className="font-bold text-black text-sm">Center Position</span>
                    </div>
                    <div className="px-6 py-3 bg-white">
                      <span className="font-bold text-2xl text-black">
                        {centerPosition}{getOrdinalSuffix(centerPosition)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Signature Section */}
              <div className="flex justify-between items-end mb-8">
                <div className="text-left">
                  <p className="text-black text-lg mb-1 font-serif" style={{ fontFamily: 'serif', fontStyle: 'italic', fontWeight: '400' }}>Ogah Omaku Ogiri</p>
                  <p className="font-bold text-black text-sm mb-3">State Chairman</p>
                  <div className="border-b-2 border-black w-40"></div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 border-t pt-4">
                <p className="font-medium">This is an official document of NAPPS Nasarawa State Chapter</p>
                <p>For verification or inquiries, contact the examination body</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
