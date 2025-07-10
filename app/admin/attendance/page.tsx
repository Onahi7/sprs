"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Download, FileText, Clock, Users, MapPin, Building2 } from "lucide-react"
import { Spinner } from "@/components/shared/spinner"
import { toast } from "sonner"

interface Chapter {
  id: number
  name: string
  registrationCount: number
  centerCount: number
}

interface Center {
  id: number
  name: string
  chapterId: number
  registrationCount: number
  coordinatorName: string
}

export default function AttendancePage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("")
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Load chapters and centers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/attendance/data')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const data = await response.json()
        setChapters(data.chapters)
        setCenters(data.centers)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load attendance data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter centers based on selected chapter
  const filteredCenters = selectedChapter 
    ? centers.filter(center => center.chapterId.toString() === selectedChapter)
    : []

  const selectedChapterData = chapters.find(ch => ch.id.toString() === selectedChapter)
  const selectedCenterData = centers.find(ct => ct.id.toString() === selectedCenter)

  const handleGenerateAttendance = async () => {
    if (!selectedChapter) {
      toast.error('Please select a chapter')
      return
    }

    setGenerating(true)
    try {
      const url = selectedCenter && selectedCenter !== "all"
        ? `/api/admin/attendance/generate?chapterId=${selectedChapter}&centerId=${selectedCenter}`
        : `/api/admin/attendance/generate?chapterId=${selectedChapter}`

      const response = await fetch(url, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate attendance list')
      }

      // Download the PDF
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      const fileName = selectedCenter && selectedCenter !== "all"
        ? `attendance_${selectedChapterData?.name.replace(/\s+/g, '_')}_${selectedCenterData?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
        : `attendance_${selectedChapterData?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Attendance list generated successfully!')
    } catch (error) {
      console.error('Error generating attendance list:', error)
      toast.error('Failed to generate attendance list')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Generate attendance lists for chapters and examination centers
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <CheckSquare className="w-4 h-4 mr-2" />
          Attendance System
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Select Location
              </CardTitle>
              <CardDescription>
                Choose chapter and center to generate attendance list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chapter Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Chapter</label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{chapter.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {chapter.registrationCount} students
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Center Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Examination Center 
                  <span className="text-muted-foreground">(Optional)</span>
                </label>
                <Select 
                  value={selectedCenter} 
                  onValueChange={setSelectedCenter}
                  disabled={!selectedChapter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All centers or select specific" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Centers</SelectItem>
                    {filteredCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        <div className="flex flex-col">
                          <span>{center.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {center.coordinatorName} • {center.registrationCount} students
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateAttendance}
                disabled={!selectedChapter || generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Attendance List
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Information Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Information */}
          {selectedChapter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Attendance List Preview
                </CardTitle>
                <CardDescription>
                  Information about the attendance list to be generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chapter</p>
                      <p className="text-lg font-semibold">{selectedChapterData?.name}</p>
                    </div>
                    
                    {selectedCenter && selectedCenter !== "all" ? (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Center</p>
                        <p className="text-lg font-semibold">{selectedCenterData?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Coordinator: {selectedCenterData?.coordinatorName}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Coverage</p>
                        <p className="text-lg font-semibold">All Centers</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedChapterData?.centerCount} examination centers
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                      <p className="text-2xl font-bold text-primary">
                        {selectedCenter && selectedCenter !== "all" ? selectedCenterData?.registrationCount : selectedChapterData?.registrationCount}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Format</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">PDF</Badge>
                        <Badge variant="outline">Landscape</Badge>
                        <Badge variant="outline">Professional</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendance List Features
              </CardTitle>
              <CardDescription>
                What's included in the generated attendance list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Professional Header</p>
                      <p className="text-sm text-muted-foreground">
                        NAPPS logo and official branding
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Student Information</p>
                      <p className="text-sm text-muted-foreground">
                        Names and registration numbers in order
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Subject Columns</p>
                      <p className="text-sm text-muted-foreground">
                        Morning and evening session checkboxes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Coordinator Details</p>
                      <p className="text-sm text-muted-foreground">
                        Center coordinator name and information
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Landscape Format</p>
                      <p className="text-sm text-muted-foreground">
                        Optimized for printing and easy marking
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Generated Date</p>
                      <p className="text-sm text-muted-foreground">
                        Current date and time stamp included
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{chapters.length}</p>
                    <p className="text-sm text-muted-foreground">Total Chapters</p>
                  </div>
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{centers.length}</p>
                    <p className="text-sm text-muted-foreground">Exam Centers</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {chapters.reduce((sum, ch) => sum + ch.registrationCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
