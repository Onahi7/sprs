"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar,
  Download,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowLeft
} from "lucide-react"

interface AttendanceReport {
  sessionId: number
  sessionName: string
  sessionDate: string
  subjectName: string
  subjectCode: string
  startTime: string
  endTime: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  leftEarlyCount: number
  notMarkedCount: number
  attendancePercentage: number
  students: Array<{
    registrationNumber: string
    firstName: string
    lastName: string
    schoolName?: string
    attendanceStatus?: string
    arrivalTime?: string
    departureTime?: string
    notes?: string
    markedAt?: string
  }>
}

interface ReportsData {
  reports: AttendanceReport[]
  summary: {
    totalSessions: number
    totalStudents: number
    overallAttendancePercentage: number
  }
}

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7') // Last 7 days
  const [selectedReport, setSelectedReport] = useState<AttendanceReport | null>(null)
  const [exportingReport, setExportingReport] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [selectedPeriod])

  useEffect(() => {
    if (selectedReport) {
      fetchSessionDetails(selectedReport.sessionId)
    }
  }, [selectedReport])

  const fetchSessionDetails = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('supervisor_token')
      const response = await fetch(`/api/supervisor/reports?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedReport(prev => prev ? { ...prev, students: data.students } : null)
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('supervisor_token')
      if (!token) {
        router.push('/supervisor/login')
        return
      }

      const response = await fetch(`/api/supervisor/reports?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReportsData(data)
      } else if (response.status === 401) {
        router.push('/supervisor/login')
      } else {
        toast({
          title: "Error",
          description: "Failed to load reports",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (sessionId?: number) => {
    setExportingReport(true)
    try {
      const token = localStorage.getItem('supervisor_token')
      const url = sessionId 
        ? `/api/supervisor/reports/export?sessionId=${sessionId}`
        : `/api/supervisor/reports/export?period=${selectedPeriod}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = sessionId 
          ? `attendance-report-session-${sessionId}.csv`
          : `attendance-report-${selectedPeriod}days.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)
        
        toast({
          title: "Success",
          description: "Report exported successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to export report",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Export failed",
        variant: "destructive",
      })
    } finally {
      setExportingReport(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200'
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'absent': return 'bg-red-100 text-red-800 border-red-200'
      case 'left_early': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />
      case 'late': return <AlertTriangle className="h-4 w-4" />
      case 'absent': return <XCircle className="h-4 w-4" />
      case 'left_early': return <Clock className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (selectedReport) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center">
                  <BookOpen className="mr-1 h-4 w-4" />
                  {selectedReport.subjectName}
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  {selectedReport.sessionName}
                </div>
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {selectedReport.startTime} - {selectedReport.endTime}
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => exportReport(selectedReport.sessionId)} disabled={exportingReport}>
            <Download className="mr-2 h-4 w-4" />
            {exportingReport ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">{selectedReport.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-xl font-bold">{selectedReport.presentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-xl font-bold">{selectedReport.absentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-xl font-bold">{selectedReport.lateCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-blue-600 rounded mr-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Attendance</p>
                  <p className="text-xl font-bold">{selectedReport.attendancePercentage.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Details</CardTitle>
            <CardDescription>
              Detailed attendance information for each student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Registration No.</th>
                    <th className="text-left p-3 font-medium">Student Name</th>
                    <th className="text-left p-3 font-medium">School</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Time Marked</th>
                    <th className="text-left p-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.students.map((student, index) => (
                    <tr key={student.registrationNumber} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">{student.registrationNumber}</td>
                      <td className="p-3">{student.firstName} {student.lastName}</td>
                      <td className="p-3 text-sm text-gray-600">{student.schoolName || 'N/A'}</td>
                      <td className="p-3">
                        {student.attendanceStatus ? (
                          <Badge className={getStatusColor(student.attendanceStatus)}>
                            <span className="flex items-center">
                              {getStatusIcon(student.attendanceStatus)}
                              <span className="ml-1 capitalize">
                                {student.attendanceStatus.replace('_', ' ')}
                              </span>
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Marked</Badge>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {student.markedAt 
                          ? new Date(student.markedAt).toLocaleTimeString() 
                          : 'N/A'
                        }
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {student.notes || 'No notes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/supervisor')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-gray-600">View and export attendance reports</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => exportReport()} disabled={exportingReport}>
            <Download className="mr-2 h-4 w-4" />
            {exportingReport ? "Exporting..." : "Export All"}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      {reportsData?.summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold">{reportsData.summary.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold">{reportsData.summary.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-purple-600 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold">%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Attendance</p>
                  <p className="text-2xl font-bold">
                    {reportsData.summary.overallAttendancePercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Session Reports</CardTitle>
          <CardDescription>
            Click on a session to view detailed attendance information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reportsData?.reports && reportsData.reports.length > 0 ? (
            <div className="space-y-4">
              {reportsData.reports.map((report) => (
                <div
                  key={report.sessionId}
                  className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{report.subjectName}</h3>
                        <Badge variant="outline">{report.subjectCode}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{report.sessionName}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{new Date(report.sessionDate).toLocaleDateString()}</span>
                        <span>{report.startTime} - {report.endTime}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Present</p>
                          <p className="font-bold text-green-600">{report.presentCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Absent</p>
                          <p className="font-bold text-red-600">{report.absentCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold">{report.totalStudents}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">
                          {report.attendancePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attendance reports found for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
