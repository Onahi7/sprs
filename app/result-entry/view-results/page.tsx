"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Search, Users, BookOpen, Edit, Trash2, Download, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: number
  username: string
  name: string
  chapterId: number
  chapterName: string
  centerId: number
  centerName: string
}

type Subject = {
  id: number
  name: string
  code: string
  maxScore: number
}

type StudentResult = {
  id: number
  registrationId: number
  subjectId: number
  score: number
  grade: string
  createdAt: string
  updatedAt: string
  registration: {
    id: number
    registrationNumber: string
    firstName: string
    lastName: string
    middleName?: string
    class: string
    centerName?: string
  }
  subject: {
    id: number
    name: string
    code: string
    maxScore: number
  }
}

type GroupedResults = {
  [studentId: number]: {
    student: StudentResult["registration"]
    results: StudentResult[]
    totalScore: number
    averagePercentage: number
    overallGrade: string
  }
}

export default function ViewResults() {
  const [user, setUser] = useState<User | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [results, setResults] = useState<StudentResult[]>([])
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({})
  const [filteredResults, setFilteredResults] = useState<GroupedResults>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (user) {
      fetchResults()
    }
  }, [user])

  useEffect(() => {
    groupResults()
  }, [results, subjects])

  useEffect(() => {
    filterResults()
  }, [groupedResults, searchTerm, selectedClass, selectedSubject])

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
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchResults = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem("resultEntryToken")
      const response = await fetch(`/api/results?chapterId=${user.chapterId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data)
      } else {
        throw new Error("Failed to fetch results")
      }
    } catch (error) {
      console.error("Error fetching results:", error)
      toast({
        title: "Error",
        description: "Failed to load results",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const groupResults = () => {
    const grouped: GroupedResults = {}

    results.forEach(result => {
      const studentId = result.registrationId
      
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student: result.registration,
          results: [],
          totalScore: 0,
          averagePercentage: 0,
          overallGrade: ""
        }
      }

      grouped[studentId].results.push(result)
    })

    // Calculate totals and averages
    Object.keys(grouped).forEach(studentId => {
      const studentData = grouped[parseInt(studentId)]
      const totalScore = studentData.results.reduce((sum, result) => sum + result.score, 0)
      const maxPossibleScore = studentData.results.reduce((sum, result) => sum + result.subject.maxScore, 0)
      const averagePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0
      
      studentData.totalScore = totalScore
      studentData.averagePercentage = averagePercentage
      studentData.overallGrade = calculateOverallGrade(averagePercentage)
    })

    setGroupedResults(grouped)
  }

  const calculateOverallGrade = (percentage: number): string => {
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B"
    if (percentage >= 60) return "C"
    if (percentage >= 50) return "D"
    if (percentage >= 40) return "E"
    return "F"
  }

  const filterResults = () => {
    let filtered = { ...groupedResults }

    if (searchTerm) {
      Object.keys(filtered).forEach(studentId => {
        const student = filtered[parseInt(studentId)].student
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
        const regNumber = student.registrationNumber.toLowerCase()
        
        if (!fullName.includes(searchTerm.toLowerCase()) && 
            !regNumber.includes(searchTerm.toLowerCase())) {
          delete filtered[parseInt(studentId)]
        }
      })
    }

    if (selectedClass !== "all") {
      Object.keys(filtered).forEach(studentId => {
        if (filtered[parseInt(studentId)].student.class !== selectedClass) {
          delete filtered[parseInt(studentId)]
        }
      })
    }

    if (selectedSubject !== "all") {
      Object.keys(filtered).forEach(studentId => {
        const studentData = filtered[parseInt(studentId)]
        const hasSubject = studentData.results.some(result => 
          result.subjectId === parseInt(selectedSubject)
        )
        if (!hasSubject) {
          delete filtered[parseInt(studentId)]
        }
      })
    }

    setFilteredResults(filtered)
  }

  const deleteResult = async (resultId: number) => {
    if (!confirm("Are you sure you want to delete this result?")) {
      return
    }

    try {
      const token = localStorage.getItem("resultEntryToken")
      const response = await fetch(`/api/results`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: resultId })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Result deleted successfully"
        })
        await fetchResults() // Refresh data
      } else {
        throw new Error("Failed to delete result")
      }
    } catch (error) {
      console.error("Error deleting result:", error)
      toast({
        title: "Error",
        description: "Failed to delete result",
        variant: "destructive"
      })
    }
  }

  const exportResults = () => {
    const csvData = []
    const headers = ["Registration Number", "Student Name", "Class", "Center", ...subjects.map(s => s.name), "Total Score", "Average %", "Overall Grade"]
    csvData.push(headers.join(","))

    Object.values(filteredResults).forEach(studentData => {
      const row = [
        studentData.student.registrationNumber,
        `"${studentData.student.firstName} ${studentData.student.lastName}"`,
        studentData.student.class,
        studentData.student.centerName || "",
        ...subjects.map(subject => {
          const result = studentData.results.find(r => r.subjectId === subject.id)
          return result ? result.score : ""
        }),
        studentData.totalScore,
        studentData.averagePercentage.toFixed(1),
        studentData.overallGrade
      ]
      csvData.push(row.join(","))
    })

    const blob = new Blob([csvData.join("\n")], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `results-${user?.chapterName}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const uniqueClasses = [...new Set(Object.values(groupedResults).map(data => data.student.class))].sort()

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
                  View Results - {user.chapterName}
                </h1>
                <p className="text-sm text-gray-500">
                  {Object.keys(filteredResults).length} students with results
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => router.push("/result-entry/enter-results")}>
                <Edit className="h-4 w-4 mr-2" />
                Enter More Results
              </Button>
            </div>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Student Results Overview
            </CardTitle>
            <CardDescription>
              View and manage examination results for your chapter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Reg. Number</TableHead>
                    <TableHead className="min-w-48">Student Name</TableHead>
                    <TableHead className="w-20">Class</TableHead>
                    {subjects.map(subject => (
                      <TableHead key={subject.id} className="w-24 text-center">
                        {subject.code}
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-center">Total</TableHead>
                    <TableHead className="w-24 text-center">Average</TableHead>
                    <TableHead className="w-20 text-center">Grade</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(filteredResults).map(studentData => (
                    <TableRow key={studentData.student.id}>
                      <TableCell className="font-mono text-sm">
                        {studentData.student.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {studentData.student.firstName} {studentData.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {studentData.student.centerName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{studentData.student.class}</Badge>
                      </TableCell>
                      {subjects.map(subject => {
                        const result = studentData.results.find(r => r.subjectId === subject.id)
                        return (
                          <TableCell key={subject.id} className="text-center">
                            {result ? (
                              <div className="space-y-1">
                                <div className="font-medium">{result.score}</div>
                                <Badge 
                                  variant={result.grade === "F" ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {result.grade}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center font-medium">
                        {studentData.totalScore}
                      </TableCell>
                      <TableCell className="text-center">
                        {studentData.averagePercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={studentData.overallGrade === "F" ? "destructive" : 
                                   studentData.overallGrade === "A" ? "default" : "secondary"}
                        >
                          {studentData.overallGrade}
                        </Badge>
                      </TableCell>                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/result-entry/enter-results")}
                            title="Edit Results"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/student/results/${studentData.student.registrationNumber}/slip`)}
                            title="View Result Slip"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {Object.keys(filteredResults).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No results found matching your criteria
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
