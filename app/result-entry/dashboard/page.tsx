"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookOpen, Users, FileText, LogOut, PenTool } from "lucide-react"
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

type Stats = {
  totalStudents: number
  studentsWithResults: number
  completedSubjects: number
  totalSubjects: number
}

export default function ResultEntryDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

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
      handleLogout()
    }
  }
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("resultEntryToken")
      if (!token) return

      const userData = localStorage.getItem("resultEntryUser")
      if (!userData) return

      const user = JSON.parse(userData)
      
      // Fetch subjects
      const subjectsResponse = await fetch("/api/admin/subjects")
      
      // Fetch results for this center (center-specific)
      const resultsResponse = await fetch(`/api/results?centerId=${user.centerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (subjectsResponse.ok) {
        const subjects = await subjectsResponse.json()
        const results = resultsResponse.ok ? await resultsResponse.json() : []
        
        // Calculate basic stats for this center
        const totalSubjects = subjects.length
        const uniqueStudentsWithResults = new Set(results.map((r: any) => r.registration?.id)).size
        
        setStats({
          totalStudents: 0, // You'll need to implement this endpoint for center-specific count
          studentsWithResults: uniqueStudentsWithResults,
          completedSubjects: results.length,
          totalSubjects
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("resultEntryToken")
    localStorage.removeItem("resultEntryUser")
    router.push("/result-entry/login")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    })
  }

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
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  NAPPS Results Portal
                </h1>
                <p className="text-sm text-gray-500">{user.chapterName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Result Entry User</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600">
            Enter and manage examination results for {user.centerName} - {user.chapterName}
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <PenTool className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.studentsWithResults}</p>
                    <p className="text-sm text-gray-600">With Results</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.completedSubjects}</p>
                    <p className="text-sm text-gray-600">Results Entered</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                    <p className="text-sm text-gray-600">Total Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PenTool className="h-5 w-5 mr-2 text-blue-600" />
                Enter Results
              </CardTitle>
              <CardDescription>
                Enter examination results for students in your chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => router.push("/result-entry/enter-results")}
              >
                Start Entering Results
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                View Results
              </CardTitle>
              <CardDescription>
                View and manage previously entered results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push("/result-entry/view-results")}
              >
                View All Results
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>
              Frequently used actions and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Chapter: {user.chapterName}</Badge>
              <Badge variant="outline">User: {user.username}</Badge>
              <Badge variant="secondary">Result Entry Access</Badge>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You can only enter results for students in your chapter</li>
                <li>• Results can be updated after initial entry</li>
                <li>• All entries are logged with your user account</li>
                <li>• Contact admin if you need to access different subjects</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
