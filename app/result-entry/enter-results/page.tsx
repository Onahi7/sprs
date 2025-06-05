"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Save, Search, Users, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: number
  username: string
  name: string
  chapterId: number
  chapterName: string
}

type Subject = {
  id: number
  name: string
  code: string
  maxScore: number
}

type Student = {
  id: number
  registrationNumber: string
  firstName: string
  lastName: string
  middleName?: string
  centerName: string
  chapterName: string
  chapterId: number
  centerId: number
}

type StudentResult = {
  id?: number
  registrationId: number
  subjectId: number
  score: number
  grade?: string
}

type StudentWithResults = Student & {
  results: { [subjectId: number]: StudentResult }
}

export default function EnterResults() {
  const [user, setUser] = useState<User | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<StudentWithResults[]>([])
  const [filteredStudents, setFilteredStudents] = useState<StudentWithResults[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm])

  const checkAuth = () => {
    const token = localStorage.getItem("resultEntryToken")
    const userData = localStorage.getItem("resultEntryUser")

    if (!token || !userData) {
      router.push("/result-entry/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/result-entry/login")
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/admin/subjects")
      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      } else {
        throw new Error("Failed to fetch subjects")
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive"
      })
    }
  }

  const fetchStudents = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem("resultEntryToken")
      const response = await fetch(`/api/students?chapterId=${user.chapterId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const studentsData: Student[] = await response.json()
        
        // Fetch existing results for these students
        const resultsResponse = await fetch(`/api/results?chapterId=${user.chapterId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        let existingResults: StudentResult[] = []
        if (resultsResponse.ok) {
          existingResults = await resultsResponse.json()
        }

        // Map students with their results
        const studentsWithResults: StudentWithResults[] = studentsData.map(student => {
          const studentResults = existingResults.filter(result => 
            result.registrationId === student.id
          )
          
          const resultsMap: { [subjectId: number]: StudentResult } = {}
          studentResults.forEach(result => {
            resultsMap[result.subjectId] = result
          })

          return {
            ...student,
            results: resultsMap
          }
        })

        setStudents(studentsWithResults)
      } else {
        throw new Error("Failed to fetch students")
      }
    } catch (error) {
      console.error("Error fetching students:", error)
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  const filterStudents = () => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }

  const updateScore = (studentId: number, subjectId: number, score: string) => {
    const numScore = score === "" ? 0 : parseInt(score)
    const subject = subjects.find(s => s.id === subjectId)
    
    if (subject && numScore > subject.maxScore) {
      toast({
        title: "Invalid Score",
        description: `Score cannot exceed ${subject.maxScore} for ${subject.name}`,
        variant: "destructive"
      })
      return
    }

    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const existingResult = student.results[subjectId]
        return {
          ...student,
          results: {
            ...student.results,
            [subjectId]: {
              ...existingResult,
              registrationId: studentId,
              subjectId,
              score: numScore,
              grade: calculateGrade(numScore, subject?.maxScore || 100)
            }
          }
        }
      }
      return student
    }))
  }

  const calculateGrade = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B"
    if (percentage >= 60) return "C"
    if (percentage >= 50) return "D"
    if (percentage >= 40) return "E"
    return "F"
  }

  const saveResults = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("resultEntryToken")
      const resultsToSave: StudentResult[] = []

      students.forEach(student => {
        Object.values(student.results).forEach(result => {
          if (result.score > 0) { // Only save non-zero scores
            resultsToSave.push(result)
          }
        })
      })

      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ results: resultsToSave })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Results saved successfully"
        })
        await fetchStudents() // Refresh data
      } else {
        throw new Error("Failed to save results")
      }
    } catch (error) {
      console.error("Error saving results:", error)
      toast({
        title: "Error",
        description: "Failed to save results",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/result-entry/dashboard")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Enter Results - {user.chapterName}
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredStudents.length} students
                </p>
              </div>
            </div>
            <Button onClick={saveResults} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save All Results
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name or registration number..."
                  value={searchTerm}                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Student Results Entry
            </CardTitle>
            <CardDescription>
              Enter examination scores for each student and subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>                  <TableRow>
                    <TableHead className="w-32">Reg. Number</TableHead>
                    <TableHead className="min-w-48">Student Name</TableHead>
                    {subjects.map(subject => (
                      <TableHead key={subject.id} className="w-32 text-center">
                        {subject.name}
                        <div className="text-xs text-gray-500">
                          (Max: {subject.maxScore})
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.centerName}
                          </div>
                        </div>                      </TableCell>
                      {subjects.map(subject => {
                        const result = student.results[subject.id]
                        return (
                          <TableCell key={subject.id}>
                            <div className="space-y-1">
                              <Input
                                type="number"
                                min="0"
                                max={subject.maxScore}
                                value={result?.score || ""}
                                onChange={(e) => updateScore(student.id, subject.id, e.target.value)}
                                className="w-20 text-center"
                                placeholder="0"
                              />
                              {result?.grade && result.score > 0 && (
                                <div className="text-center">
                                  <Badge 
                                    variant={result.grade === "F" ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {result.grade}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
