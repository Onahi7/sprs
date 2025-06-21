"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, BookOpen, ChevronLeft, Download } from "lucide-react"
import Link from "next/link"

export default function StudentResultsPage() {
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [results, setResults] = useState<any>(null)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationNumber.trim()) {
      setError("Please enter your registration number")
      return
    }

    setLoading(true)
    setError("")
    setResults(null)

    try {
      // First, verify the registration exists
      const registrationResponse = await fetch(`/api/registrations?registrationNumber=${registrationNumber}`)
      
      if (!registrationResponse.ok) {
        if (registrationResponse.status === 404) {
          setError("Registration number not found. Please check and try again.")
        } else {
          throw new Error("Failed to verify registration")
        }
        return
      }

      const registration = await registrationResponse.json()

      // Check if payment is completed
      if (registration.paymentStatus !== 'completed') {
        setError("Results are only available for students who have completed payment.")
        return
      }

      // Fetch results for this registration
      const resultsResponse = await fetch(`/api/results?registrationNumber=${registrationNumber}`)
      
      if (resultsResponse.ok) {
        const studentResults = await resultsResponse.json()
        
        if (studentResults.length === 0) {
          setError("Results not yet available. Please check back later.")
          return
        }

        // Group results by student and calculate totals
        const processedResults = processStudentResults(studentResults, registration)
        setResults(processedResults)
      } else {
        setError("Results not yet available. Please check back later.")
      }

    } catch (error) {
      console.error("Error fetching results:", error)
      setError("An error occurred while fetching results. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const processStudentResults = (studentResults: any[], registration: any) => {
    // Group results by subject
    const resultsBySubject = studentResults.reduce((acc: any, result: any) => {
      acc[result.subject.id] = result
      return acc
    }, {})

    // Calculate totals
    const totalScore = studentResults.reduce((sum, result) => sum + result.score, 0)
    const totalMaxScore = studentResults.reduce((sum, result) => sum + result.subject.maxScore, 0)
    const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
    const overallGrade = calculateOverallGrade(averagePercentage)

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
      averagePercentage,
      overallGrade,
      isPassed: averagePercentage >= 50 // Assuming 50% is pass mark
    }
  }

  const calculateOverallGrade = (percentage: number): string => {
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B"
    if (percentage >= 60) return "C"
    if (percentage >= 50) return "D"
    if (percentage >= 40) return "E"
    return "F"
  }

  const downloadResultSlip = () => {
    if (!results) return
    
    // Navigate to result slip view for printing/downloading
    router.push(`/student/results/${results.student.registrationNumber}/slip`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              NAPPS Examination Results
            </h1>
            <p className="text-gray-600">
              Enter your registration number to view your examination results
            </p>
          </div>

          {!results ? (
            <Card className="shadow-lg border-0">
              <CardHeader className="text-center">
                <CardTitle>Check Your Results</CardTitle>
                <CardDescription>
                  Enter your registration number to view your examination results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <Label htmlFor="registration-number">Registration Number</Label>
                    <Input
                      id="registration-number"
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                      placeholder="e.g., 000001UO"
                      required
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        View Results
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Student Information */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Examination Results</span>
                    <Button onClick={downloadResultSlip} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download Result Slip
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Student Name</Label>
                        <p className="text-lg font-semibold">
                          {results.student.firstName} {results.student.middleName} {results.student.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Registration Number</Label>
                        <p className="text-lg font-mono">{results.student.registrationNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Class</Label>
                        <p className="text-lg">{results.student.class}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">School</Label>
                        <p className="text-lg">{results.student.schoolName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Center</Label>
                        <p className="text-lg">{results.student.centerName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Chapter</Label>
                        <p className="text-lg">{results.student.chapterName}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Table */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Subject Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Subject</th>
                          <th className="text-center py-3 px-4 font-semibold">Score</th>
                          <th className="text-center py-3 px-4 font-semibold">Max Score</th>
                          <th className="text-center py-3 px-4 font-semibold">Percentage</th>
                          <th className="text-center py-3 px-4 font-semibold">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.subjects.map((subject: any) => {
                          const result = results.results[subject.id]
                          const percentage = (result.score / subject.maxScore) * 100
                          
                          return (
                            <tr key={subject.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{subject.name}</td>
                              <td className="text-center py-3 px-4">{result.score}</td>
                              <td className="text-center py-3 px-4">{subject.maxScore}</td>
                              <td className="text-center py-3 px-4">{percentage.toFixed(1)}%</td>
                              <td className="text-center py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                  result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                  result.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {result.grade}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Performance */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Overall Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.totalScore}</div>
                      <div className="text-sm text-gray-600">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">{results.totalMaxScore}</div>
                      <div className="text-sm text-gray-600">Maximum Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.averagePercentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${results.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {results.overallGrade}
                      </div>
                      <div className="text-sm text-gray-600">Overall Grade</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                      results.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {results.isPassed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search Again */}
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResults(null)
                    setRegistrationNumber("")
                    setError("")
                  }}
                >
                  Search Another Result
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
