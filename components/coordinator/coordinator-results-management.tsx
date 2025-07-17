"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Trophy, Users, School, FileText, Medal, TrendingUp, BarChart3 } from "lucide-react"
import { toast } from "sonner"

interface Student {
  id: number
  registrationNumber: string
  firstName: string
  lastName: string
  middleName?: string
  schoolName: string
  centerName: string
  results: Array<{
    subjectName: string
    score: number
    grade: string
  }>
  totalScore: number
  totalMaxScore: number
  averagePercentage: number
  overallGrade: string
  centerPosition?: number
}

interface CoordinatorInfo {
  id: number
  name: string
  chapterId: number
  chapterName: string
}

export function CoordinatorResultsManagement() {
  const [activeTab, setActiveTab] = useState("chapter-results")
  const [students, setStudents] = useState<Student[]>([])
  const [chapterBest, setChapterBest] = useState<Student[]>([])
  const [centerBest, setCenterBest] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [coordinatorInfo, setCoordinatorInfo] = useState<CoordinatorInfo | null>(null)
  const [centers, setCenters] = useState<Array<{ id: number; name: string }>>([])
  const [performanceStats, setPerformanceStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    passRate: 0,
    topPerformer: null as Student | null,
    gradeDistribution: {
      A: 0, B: 0, C: 0, D: 0, E: 0, F: 0
    }
  })

  useEffect(() => {
    fetchCoordinatorInfo()
    fetchResults()
  }, [])

  const fetchCoordinatorInfo = async () => {
    try {
      const response = await fetch('/api/coordinator/chapter-info')
      if (response.ok) {
        const data = await response.json()
        setCoordinatorInfo({
          id: data.coordinator.id,
          name: data.coordinator.name,
          chapterId: data.coordinator.chapterId,
          chapterName: data.chapter.name
        })
        setCenters(data.centers || [])
      }
    } catch (error) {
      console.error('Error fetching coordinator info:', error)
    }
  }

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/coordinator/results')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        setChapterBest(data.chapterBest || [])
        setCenterBest(data.centerBest || [])
        
        // Calculate performance statistics
        const students = data.students || []
        const totalStudents = students.length
        const totalScore = students.reduce((sum: number, student: Student) => sum + student.averagePercentage, 0)
        const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0
        const passCount = students.filter((student: Student) => student.averagePercentage >= 40).length
        const passRate = totalStudents > 0 ? (passCount / totalStudents) * 100 : 0
        
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
        students.forEach((student: Student) => {
          gradeDistribution[student.overallGrade as keyof typeof gradeDistribution]++
        })
        
        setPerformanceStats({
          totalStudents,
          averageScore,
          passRate,
          topPerformer: students[0] || null,
          gradeDistribution
        })
      } else {
        toast.error('Failed to fetch results')
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Error loading results')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'chapter' | 'center' | 'all' | 'performance') => {
    try {
      let endpoint = `/api/coordinator/results/export?type=${type}`
      let defaultFilename = `${coordinatorInfo?.chapterName || 'chapter'}-results-${type}.csv`
      
      if (type === 'performance') {
        endpoint = `/api/coordinator/results/export?type=performance`
        defaultFilename = `${coordinatorInfo?.chapterName || 'chapter'}-performance-summary.csv`
      }
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = defaultFilename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Export completed successfully')
      } else {
        toast.error('Export failed')
      }
    } catch (error) {
      console.error('Error exporting results:', error)
      toast.error('Error during export')
    }
  }

  const getPositionSuffix = (position: number) => {
    if (position % 10 === 1 && position % 100 !== 11) return 'st'
    if (position % 10 === 2 && position % 100 !== 12) return 'nd'
    if (position % 10 === 3 && position % 100 !== 13) return 'rd'
    return 'th'
  }

  const renderStudentTable = (students: Student[], showPosition = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          {showPosition && <TableHead className="w-[80px]">Position</TableHead>}
          <TableHead>Registration Number</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Center</TableHead>
          <TableHead className="text-right">Total Score</TableHead>
          <TableHead className="text-right">Percentage</TableHead>
          <TableHead className="text-center">Grade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student, index) => (
          <TableRow key={student.id}>
            {showPosition && (
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {index + 1 <= 3 && (
                    <Medal className={`h-4 w-4 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      'text-amber-600'
                    }`} />
                  )}
                  {index + 1}{getPositionSuffix(index + 1)}
                </div>
              </TableCell>
            )}
            <TableCell className="font-medium">{student.registrationNumber}</TableCell>
            <TableCell>
              {student.firstName} {student.middleName || ''} {student.lastName}
            </TableCell>
            <TableCell>{student.schoolName}</TableCell>
            <TableCell>{student.centerName}</TableCell>
            <TableCell className="text-right">
              {student.totalScore}/{student.totalMaxScore}
            </TableCell>
            <TableCell className="text-right">
              {student.averagePercentage.toFixed(1)}%
            </TableCell>
            <TableCell className="text-center">
              <Badge
                variant={
                  student.overallGrade === 'A' ? 'default' :
                  student.overallGrade === 'B' ? 'secondary' :
                  student.overallGrade === 'C' ? 'outline' :
                  'destructive'
                }
              >
                {student.overallGrade}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chapter Info Header */}
      {coordinatorInfo && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{coordinatorInfo.chapterName} Chapter</CardTitle>
                <CardDescription>
                  Coordinator: {coordinatorInfo.name}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <School className="h-4 w-4" />
                <span>{centers.length} Centers</span>
                <Users className="h-4 w-4 ml-4" />
                <span>{students.length} Students</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Performance Overview */}
      {!loading && performanceStats.totalStudents > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across {centers.length} centers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.averageScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Chapter performance
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.passRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                40% and above
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceStats.topPerformer ? (
                <div>
                  <div className="text-sm font-bold truncate">
                    {performanceStats.topPerformer.firstName} {performanceStats.topPerformer.lastName}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performanceStats.topPerformer.averagePercentage.toFixed(1)}% - Grade {performanceStats.topPerformer.overallGrade}
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Distribution */}
      {!loading && performanceStats.totalStudents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grade Distribution</CardTitle>
            <CardDescription>
              Breakdown of student performance by grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {Object.entries(performanceStats.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-muted-foreground">Grade {grade}</div>
                  <div className="text-xs text-muted-foreground">
                    {performanceStats.totalStudents > 0 
                      ? ((count / performanceStats.totalStudents) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      {!loading && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Export Options</CardTitle>
            <CardDescription>
              Download results data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button onClick={() => handleExport('all')} className="gap-2" variant="outline">
                <Download className="h-4 w-4" />
                All Results
              </Button>
              <Button onClick={() => handleExport('chapter')} className="gap-2" variant="outline">
                <Trophy className="h-4 w-4" />
                Chapter Best 10
              </Button>
              <Button onClick={() => handleExport('center')} className="gap-2" variant="outline">
                <School className="h-4 w-4" />
                Center Best 10
              </Button>
              <Button onClick={() => handleExport('performance')} className="gap-2" variant="outline">
                <BarChart3 className="h-4 w-4" />
                Performance Summary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="chapter-results" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Results
          </TabsTrigger>
          <TabsTrigger value="center-best" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            Center Top 10
          </TabsTrigger>
          <TabsTrigger value="chapter-best" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Chapter Top 10
          </TabsTrigger>
        </TabsList>

        {/* All Chapter Results */}
        <TabsContent value="chapter-results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Complete Chapter Results</CardTitle>
                  <CardDescription>
                    View all student results from {coordinatorInfo?.chapterName} chapter
                  </CardDescription>
                </div>
                <Button onClick={() => handleExport('all')} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export All Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No examination results available yet</p>
                  <p className="text-sm">Results will appear here once examinations are completed</p>
                </div>
              ) : (
                renderStudentTable(students)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Center Best 10 */}
        <TabsContent value="center-best" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Center Top Performers</CardTitle>
                  <CardDescription>
                    Top 10 performing students across all centers in your chapter
                  </CardDescription>
                </div>
                <Button onClick={() => handleExport('center')} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Center Top 10
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {centerBest.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No center performance data available yet</p>
                  <p className="text-sm">Top performers will be listed here after examinations</p>
                </div>
              ) : (
                renderStudentTable(centerBest, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chapter Best 10 */}
        <TabsContent value="chapter-best" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chapter Top Performers</CardTitle>
                  <CardDescription>
                    Top 10 performing students in {coordinatorInfo?.chapterName} chapter
                  </CardDescription>
                </div>
                <Button onClick={() => handleExport('chapter')} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Chapter Top 10
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {chapterBest.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chapter performance data available yet</p>
                  <p className="text-sm">Top performers will be showcased here after examinations</p>
                </div>
              ) : (
                renderStudentTable(chapterBest, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
