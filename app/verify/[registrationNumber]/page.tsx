"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Shield, FileText, User, Calendar, MapPin } from "lucide-react"
import Image from "next/image"

interface VerificationResult {
  isValid: boolean
  student: {
    registrationNumber: string
    firstName: string
    lastName: string
    middleName?: string
    centerName: string
    chapterName: string
    schoolName: string
    passportUrl?: string
  }
  results?: {
    subjects: Array<{
      id: number
      name: string
      maxScore: number
    }>
    scores: { [subjectId: number]: { score: number; grade: string } }
    totalScore: number
    totalMaxScore: number
    averagePercentage: number
    overallGrade: string
    centerPosition?: number
  }
  verification: {
    verifiedAt: string
    examDate: string
    issuedBy: string
  }
}

export default function VerifyPage() {
  const params = useParams()
  const registrationNumber = params.registrationNumber as string
  
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (registrationNumber) {
      verifyRegistration()
    }
  }, [registrationNumber])

  const verifyRegistration = async () => {
    try {
      const response = await fetch(`/api/verify/${registrationNumber}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Registration number not found")
        }
        throw new Error("Verification failed")
      }
      
      const data = await response.json()
      setVerificationResult(data)
    } catch (error: any) {
      console.error("Error verifying registration:", error)
      setError(error.message || "Failed to verify registration")
    } finally {
      setLoading(false)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-green-600" />
          <p className="text-gray-600">Verifying registration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={verifyRegistration} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!verificationResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle>No Results Found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Verification Header */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {verificationResult.isValid ? (
                <CheckCircle className="h-20 w-20 text-green-600" />
              ) : (
                <XCircle className="h-20 w-20 text-red-600" />
              )}
            </div>
            <CardTitle className={`text-2xl ${verificationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-lg">
              Registration Number: <span className="font-mono font-bold">{registrationNumber}</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {verificationResult.isValid && (
          <>
            {/* NAPPS Header */}
            <Card className="mb-8">
              <CardHeader className="text-center border-b">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 mr-6 rounded-full border-4 border-green-600 p-1 bg-white">
                    <Image
                      src="https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png"
                      alt="NAPPS Logo"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-logo.svg";
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <h1 className="text-2xl font-bold text-black">
                      NAPPS NASARAWA STATE CHAPTER
                    </h1>
                    <p className="text-gray-600">Besides SALAMATU Hall Lafia, Jos Road</p>
                    <p className="text-gray-600">Napps Nasarawa State Unified Certificate Examination</p>
                    <p className="text-sm text-gray-500">(NNSUCE-2024)</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-700 text-white text-lg py-2 px-4">
                  VERIFIED RESULT SLIP
                </Badge>
              </CardHeader>
            </Card>

            {/* Student Information */}
            <div className="grid gap-8 md:grid-cols-3 mb-8">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Student Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="font-bold text-lg">
                          {verificationResult.student.firstName} {verificationResult.student.middleName} {verificationResult.student.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Registration Number</label>
                        <p className="font-mono font-bold text-lg">{verificationResult.student.registrationNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">School</label>
                        <p className="font-medium">{verificationResult.student.schoolName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Center</label>
                        <p className="font-medium">{verificationResult.student.centerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Chapter</label>
                        <p className="font-medium">{verificationResult.student.chapterName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Exam Date</label>
                        <p className="font-medium">{verificationResult.verification.examDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Student Photo */}
              <Card>
                <CardHeader>
                  <CardTitle>Student Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-64 border-2 border-gray-300 bg-green-100 rounded-lg overflow-hidden">
                    {verificationResult.student.passportUrl ? (
                      <Image 
                        src={verificationResult.student.passportUrl} 
                        alt="Student Photo"
                        width={200}
                        height={256}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 flex items-center justify-center">
                        <span className="text-gray-500">No Photo Available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results */}
            {verificationResult.results && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Examination Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="bg-green-700 text-white border border-gray-300 p-4 text-left font-bold">
                            SUBJECT
                          </th>
                          <th className="bg-green-700 text-white border border-gray-300 p-4 text-center font-bold">
                            SCORE
                          </th>
                          <th className="bg-green-700 text-white border border-gray-300 p-4 text-center font-bold">
                            GRADE
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {verificationResult.results.subjects.map((subject, index) => {
                          const result = verificationResult.results!.scores[subject.id]
                          return (
                            <tr key={subject.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="border border-gray-300 p-4 font-medium text-lg">
                                {subject.name}
                              </td>
                              <td className="border border-gray-300 p-4 text-center font-bold text-xl">
                                {result.score}
                              </td>
                              <td className="border border-gray-300 p-4 text-center font-bold text-xl">
                                {result.grade}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center mt-8 gap-4">
                    <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-400 px-6 py-2">
                        <span className="font-bold text-black text-sm">TOTAL SCORE</span>
                      </div>
                      <div className="px-6 py-3 bg-white">
                        <span className="font-bold text-2xl text-black">
                          {verificationResult.results.totalScore}/{verificationResult.results.totalMaxScore}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-400 px-6 py-2">
                        <span className="font-bold text-black text-sm">PERCENTAGE</span>
                      </div>
                      <div className="px-6 py-3 bg-white">
                        <span className="font-bold text-2xl text-black">
                          {verificationResult.results.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-400 px-6 py-2">
                        <span className="font-bold text-black text-sm">GRADE</span>
                      </div>
                      <div className="px-6 py-3 bg-white">
                        <span className="font-bold text-2xl text-black">
                          {verificationResult.results.overallGrade}
                        </span>
                      </div>
                    </div>

                    {verificationResult.results.centerPosition && verificationResult.results.centerPosition > 0 && (
                      <div className="bg-gray-200 rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-400 px-6 py-2">
                          <span className="font-bold text-black text-sm">CENTER POSITION</span>
                        </div>
                        <div className="px-6 py-3 bg-white">
                          <span className="font-bold text-2xl text-black">
                            {verificationResult.results.centerPosition}{getOrdinalSuffix(verificationResult.results.centerPosition)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification Details */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Verified At</label>
                    <p className="font-medium">{new Date(verificationResult.verification.verifiedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Issued By</label>
                    <p className="font-medium">{verificationResult.verification.issuedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Verification URL</label>
                    <p className="font-mono text-sm text-blue-600 break-all">
                      https://exams.nappsnasarawa.com/verify/{registrationNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 border-t pt-6">
          <p className="font-medium">This is an official verification from NAPPS Nasarawa State Chapter</p>
          <p>For further inquiries, contact the examination body</p>
          <p className="mt-2 text-xs">
            Verification performed on {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
