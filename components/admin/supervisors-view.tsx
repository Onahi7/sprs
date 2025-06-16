"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Phone, Building2, MapPin } from "lucide-react"

interface Supervisor {
  id: number
  chapterId: number
  centerId: number
  chapterName?: string
  centerName?: string
  name: string
  phoneNumber: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Chapter {
  id: string
  name: string
}

export function AdminSupervisorsView() {
  const { toast } = useToast()
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChapters()
  }, [])

  useEffect(() => {
    fetchSupervisors()
  }, [selectedChapter])

  const fetchChapters = async () => {
    try {
      const response = await fetch('/api/admin/chapters')
      if (response.ok) {
        const data = await response.json()
        setChapters(data.chapters || [])
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  const fetchSupervisors = async () => {
    try {
      setLoading(true)
      const params = selectedChapter !== "all" ? `?chapterId=${selectedChapter}` : ""
      const response = await fetch(`/api/admin/supervisors${params}`)
      if (response.ok) {
        const data = await response.json()
        setSupervisors(data.supervisors || [])
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error)
      toast({
        title: "Error",
        description: "Failed to load supervisors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getChapterName = (chapterId: number, supervisor?: Supervisor) => {
    if (supervisor?.chapterName) return supervisor.chapterName;
    const chapter = chapters.find(c => c.id === chapterId.toString())
    return chapter?.name || `Chapter ${chapterId}`
  }

  const groupSupervisorsByChapter = () => {
    const grouped: { [key: number]: Supervisor[] } = {}
    supervisors.filter(s => s.isActive).forEach(supervisor => {
      if (!grouped[supervisor.chapterId]) {
        grouped[supervisor.chapterId] = []
      }
      grouped[supervisor.chapterId].push(supervisor)
    })
    return grouped
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chapter Supervisors</CardTitle>
          <CardDescription>View all supervisors by chapter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const groupedSupervisors = groupSupervisorsByChapter()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chapter Supervisors</CardTitle>
            <CardDescription>
              View and manage supervisors across all chapters
            </CardDescription>
          </div>
          <Select value={selectedChapter} onValueChange={setSelectedChapter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Chapter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.keys(groupedSupervisors).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No supervisors found</p>
              <p className="text-sm">
                {selectedChapter === "all" 
                  ? "No chapters have added supervisors yet"
                  : "This chapter hasn't added any supervisors yet"
                }
              </p>
            </div>
          ) : (
            Object.entries(groupedSupervisors).map(([chapterId, chapterSupervisors]) => (
              <div key={chapterId} className="border rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold">{getChapterName(parseInt(chapterId), chapterSupervisors[0])}</h3>
                  <Badge variant="outline" className="ml-2">
                    {chapterSupervisors.length} Supervisors
                  </Badge>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">                  {chapterSupervisors.map((supervisor) => (
                    <div
                      key={`admin-supervisor-${supervisor.id}`}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{supervisor.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {supervisor.phoneNumber}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {supervisor.centerName || `Center ${supervisor.centerId}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(groupedSupervisors).length}
                </div>
                <div className="text-sm text-gray-600">Chapters with Supervisors</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {supervisors.filter(s => s.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Total Active Supervisors</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {supervisors.filter(s => s.isActive).length > 0 
                    ? Math.round((Object.keys(groupedSupervisors).length / chapters.length) * 100)
                    : 0
                  }%
                </div>
                <div className="text-sm text-gray-600">Chapter Coverage</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
