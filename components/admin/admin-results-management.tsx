"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Search, Download, Users, BookOpen, Trophy, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SubjectsManagement } from "./subjects-management"
import { ResultEntryUsersManagement } from "./result-entry-users-management"

type Subject = {
  id: number
  name: string
  code: string
  maxScore: number
}

type Chapter = {
  id: number
  name: string
  code: string
}

type StudentResult = {
  id: number
  registrationId: number
  subjectId: number
  score: number
  grade: string
  enteredAt: string
  updatedAt: string
  registration: {
    id: number
    registrationNumber: string
    firstName: string
    lastName: string
    middleName?: string
    class: string
  }
  subject: {
    id: number
    name: string
    code: string
    maxScore: number
  }
  chapter: {
    id: number
    name: string
  }
  enteredBy: {
    id: number
    name: string
    username: string
  }
}

type GroupedResults = {
  [studentId: number]: {
    student: StudentResult["registration"] & { chapterName: string }
    results: StudentResult[]
    totalScore: number
    averagePercentage: number
    overallGrade: string
  }
}

export function AdminResultsManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [results, setResults] = useState<StudentResult[]>([])
  const [groupedResults, setGroupedResults] = useState<GroupedResults>({})
  const [filteredResults, setFilteredResults] = useState<GroupedResults>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [stats, setStats] = useState({
    totalResults: 0,
    studentsWithResults: 0,
    averageScore: 0,
    totalSubjects: 0
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    groupResults()
  }, [results, subjects])

  useEffect(() => {
    filterResults()
    calculateStats()
  }, [groupedResults, searchTerm, selectedChapter, selectedClass, selectedSubject])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch subjects
      const subjectsResponse = await fetch("/api/admin/subjects")
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json()
        setSubjects(subjectsData)
      }

      // Fetch chapters
      const chaptersResponse = await fetch("/api/admin/chapters")
      if (chaptersResponse.ok) {
        const chaptersData = await chaptersResponse.json()
        setChapters(chaptersData)
      }

      // Fetch all results
      const resultsResponse = await fetch("/api/results")
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setResults(resultsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data",
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
          student: {
            ...result.registration,
            chapterName: result.chapter.name
          },
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

    if (selectedChapter !== "all") {
      Object.keys(filtered).forEach(studentId => {
        if (filtered[parseInt(studentId)].student.chapterName !== selectedChapter) {
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

  const calculateStats = () => {
    const totalResults = results.length
    const studentsWithResults = Object.keys(groupedResults).length
    const totalScores = Object.values(groupedResults).reduce((sum, data) => sum + data.totalScore, 0)
    const averageScore = studentsWithResults > 0 ? totalScores / studentsWithResults : 0

    setStats({
      totalResults,
      studentsWithResults,
      averageScore: Math.round(averageScore * 10) / 10,
      totalSubjects: subjects.length
    })
  }

  const exportResults = () => {
    const csvData = []
    const headers = [
      "Registration Number", "Student Name", "Chapter", "Class", 
      ...subjects.map(s => `${s.name} Score`),
      ...subjects.map(s => `${s.name} Grade`),
      "Total Score", "Average %", "Overall Grade", "Entry Date"
    ]
    csvData.push(headers.join(","))

    Object.values(filteredResults).forEach(studentData => {
      const row = [
        studentData.student.registrationNumber,
        `"${studentData.student.firstName} ${studentData.student.lastName}"`,
        studentData.student.chapterName,
        studentData.student.class,
        ...subjects.map(subject => {
          const result = studentData.results.find(r => r.subjectId === subject.id)
          return result ? result.score : ""
        }),
        ...subjects.map(subject => {
          const result = studentData.results.find(r => r.subjectId === subject.id)
          return result ? result.grade : ""
        }),
        studentData.totalScore,
        studentData.averagePercentage.toFixed(1),
        studentData.overallGrade,
        studentData.results[0]?.enteredAt ? new Date(studentData.results[0].enteredAt).toLocaleDateString() : ""
      ]
      csvData.push(row.join(","))
    })

    const blob = new Blob([csvData.join("\n")], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `napps-results-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Results exported successfully"
    })
  }

  const uniqueClasses = [...new Set(Object.values(groupedResults).map(data => data.student.class))].sort()
  const chapterNames = [...new Set(chapters.map(c => c.name))].sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
                <p className="text-sm text-gray-600">Total Results</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.studentsWithResults}</p>
                <p className="text-sm text-gray-600">Students with Results</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                <p className="text-sm text-gray-600">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">
            <FileText className="h-4 w-4 mr-2" />
            Results Overview
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpen className="h-4 w-4 mr-2" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Result Entry Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
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
                  <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {chapterNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button onClick={exportResults} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Student Results</CardTitle>
              <CardDescription>
                {Object.keys(filteredResults).length} students with examination results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Reg. Number</TableHead>
                      <TableHead className="min-w-48">Student Name</TableHead>
                      <TableHead className="w-32">Chapter</TableHead>
                      <TableHead className="w-20">Class</TableHead>
                      {subjects.map(subject => (
                        <TableHead key={subject.id} className="w-24 text-center">
                          {subject.code}
                        </TableHead>
                      ))}                      <TableHead className="w-24 text-center">Total</TableHead>
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
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{studentData.student.chapterName}</Badge>
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
                        </TableCell>                        <TableCell className="text-center">
                          <Badge 
                            variant={studentData.overallGrade === "F" ? "destructive" : 
                                     studentData.overallGrade === "A" ? "default" : "secondary"}
                          >
                            {studentData.overallGrade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/student/results/${studentData.student.registrationNumber}/slip`, '_blank')}
                            title="View Result Slip"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
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
        </TabsContent>

        <TabsContent value="subjects">
          <SubjectsManagement />
        </TabsContent>

        <TabsContent value="users">
          <ResultEntryUsersManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
