"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  User,
  Calendar,
  BookOpen,
  ArrowLeft
} from "lucide-react"

interface Student {
  registrationId: number
  registrationNumber: string
  firstName: string
  middleName?: string
  lastName: string
  schoolName?: string
  passportUrl?: string
  attendanceId?: number
  attendanceStatus?: string
  arrivalTime?: string
  departureTime?: string
  notes?: string
  markedAt?: string
}

interface ExamSession {
  id: number
  sessionName: string
  sessionDate: string
  startTime: string
  endTime: string
  subjectName: string
  subjectCode: string
}

interface AttendanceData {
  examSession: ExamSession
  students: Student[]
  supervisor: {
    name: string
    centerId: number
  }
}

export default function AttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [markingAttendance, setMarkingAttendance] = useState(false)
  const [attendanceForm, setAttendanceForm] = useState({
    status: '',
    notes: ''
  })

  const sessionId = searchParams.get('session')

  useEffect(() => {
    if (sessionId) {
      fetchAttendanceData(sessionId)
    } else {
      fetchTodaySessions()
    }
  }, [sessionId])

  const fetchTodaySessions = async () => {
    try {
      const token = localStorage.getItem('supervisor_token')
      if (!token) {
        router.push('/supervisor/login')
        return
      }

      const response = await fetch('/api/supervisor/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.sessions.length === 1) {
          // Auto-select if only one session
          router.push(`/supervisor/attendance?session=${data.sessions[0].id}`)
        } else {
          setAttendanceData({ 
            examSession: null as any, 
            students: [], 
            supervisor: data.supervisor,
            sessions: data.sessions 
          } as any)
        }
      } else if (response.status === 401) {
        router.push('/supervisor/login')
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceData = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('supervisor_token')
      if (!token) {
        router.push('/supervisor/login')
        return
      }

      const response = await fetch(`/api/supervisor/attendance?sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAttendanceData(data)
      } else if (response.status === 401) {
        router.push('/supervisor/login')
      } else {
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async () => {
    if (!selectedStudent || !attendanceForm.status) {
      toast({
        title: "Error",
        description: "Please select attendance status",
        variant: "destructive",
      })
      return
    }

    setMarkingAttendance(true)
    try {
      const token = localStorage.getItem('supervisor_token')
      const response = await fetch('/api/supervisor/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationId: selectedStudent.registrationId,
          examSessionId: attendanceData?.examSession.id,
          attendanceStatus: attendanceForm.status,
          notes: attendanceForm.notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: result.message,
        })
        
        // Update local state
        if (attendanceData) {
          const updatedStudents = attendanceData.students.map(student => 
            student.registrationId === selectedStudent.registrationId
              ? {
                  ...student,
                  attendanceStatus: attendanceForm.status,
                  notes: attendanceForm.notes,
                  markedAt: new Date().toISOString()
                }
              : student
          )
          setAttendanceData({ ...attendanceData, students: updatedStudents })
        }
        
        setSelectedStudent(null)
        setAttendanceForm({ status: '', notes: '' })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to mark attendance",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setMarkingAttendance(false)
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
      default: return <User className="h-4 w-4" />
    }
  }

  const filteredStudents = attendanceData?.students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.schoolName && student.schoolName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

  const attendanceStats = attendanceData?.students.reduce((acc, student) => {
    const status = student.attendanceStatus || 'not_marked'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

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

  // Session selection view
  if (!sessionId && attendanceData && (attendanceData as any).sessions) {
    const sessions = (attendanceData as any).sessions
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push('/supervisor')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Select Exam Session</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session: any) => (
            <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent 
                className="p-6"
                onClick={() => router.push(`/supervisor/attendance?session=${session.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{session.subjectName}</h3>
                    <p className="text-sm text-gray-600">{session.sessionName}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{session.subjectCode}</Badge>
                      <span className="text-sm text-gray-500">
                        {session.startTime} - {session.endTime}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline">
                    Take Attendance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!attendanceData || !attendanceData.examSession) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No attendance data available</p>
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
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center">
                <BookOpen className="mr-1 h-4 w-4" />
                {attendanceData.examSession.subjectName}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {attendanceData.examSession.sessionName}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {attendanceData.examSession.startTime} - {attendanceData.examSession.endTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-xl font-bold">{attendanceData.students.length}</p>
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
                <p className="text-xl font-bold">{attendanceStats.present || 0}</p>
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
                <p className="text-xl font-bold">{attendanceStats.absent || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Not Marked</p>
                <p className="text-xl font-bold">{attendanceStats.not_marked || attendanceData.students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, registration number, or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <CardDescription>
            Click on a student to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <div
                key={student.registrationId}
                className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-all"
                onClick={() => {
                  setSelectedStudent(student)
                  setAttendanceForm({
                    status: student.attendanceStatus || '',
                    notes: student.notes || ''
                  })
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {student.firstName} {student.middleName} {student.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{student.registrationNumber}</p>
                    {student.schoolName && (
                      <p className="text-xs text-blue-600 mt-1">{student.schoolName}</p>
                    )}
                  </div>
                  <div className="ml-2">
                    {student.attendanceStatus ? (
                      <Badge className={getStatusColor(student.attendanceStatus)}>
                        <span className="flex items-center">
                          {getStatusIcon(student.attendanceStatus)}
                          <span className="ml-1 capitalize">{student.attendanceStatus.replace('_', ' ')}</span>
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Marked</Badge>
                    )}
                  </div>
                </div>
                {student.markedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Marked: {new Date(student.markedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              {selectedStudent && (
                <span>
                  {selectedStudent.firstName} {selectedStudent.lastName} ({selectedStudent.registrationNumber})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendance Status</label>
              <Select
                value={attendanceForm.status}
                onValueChange={(value) => setAttendanceForm({ ...attendanceForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="left_early">Left Early</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about the student..."
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedStudent(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAttendance}
              disabled={!attendanceForm.status || markingAttendance}
            >
              {markingAttendance ? "Marking..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
