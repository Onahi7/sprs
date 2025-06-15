"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Phone, Building2 } from "lucide-react"

interface Facilitator {
  id: number
  chapterId: number
  chapterName?: string
  name: string
  phoneNumber: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Chapter {
  id: string
  name: string
}

export function AdminFacilitatorsView() {
  const { toast } = useToast()
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChapters()
  }, [])

  useEffect(() => {
    fetchFacilitators()
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

  const fetchFacilitators = async () => {
    try {
      setLoading(true)
      const params = selectedChapter !== "all" ? `?chapterId=${selectedChapter}` : ""
      const response = await fetch(`/api/admin/facilitators${params}`)
      if (response.ok) {
        const data = await response.json()
        setFacilitators(data.facilitators || [])
      }
    } catch (error) {
      console.error('Error fetching facilitators:', error)
      toast({
        title: "Error",
        description: "Failed to load facilitators",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getChapterName = (chapterId: number, facilitator?: Facilitator) => {
    if (facilitator?.chapterName) return facilitator.chapterName;
    const chapter = chapters.find(c => c.id === chapterId.toString())
    return chapter?.name || `Chapter ${chapterId}`
  }

  const groupFacilitatorsByChapter = () => {
    const grouped: { [key: number]: Facilitator[] } = {}
    facilitators.filter(f => f.isActive).forEach(facilitator => {
      if (!grouped[facilitator.chapterId]) {
        grouped[facilitator.chapterId] = []
      }
      grouped[facilitator.chapterId].push(facilitator)
    })
    return grouped
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chapter Facilitators</CardTitle>
          <CardDescription>View all facilitators by chapter</CardDescription>
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

  const groupedFacilitators = groupFacilitatorsByChapter()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chapter Facilitators</CardTitle>
            <CardDescription>
              View and manage facilitators across all chapters
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
          {Object.keys(groupedFacilitators).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No facilitators found</p>
              <p className="text-sm">
                {selectedChapter === "all" 
                  ? "No chapters have added facilitators yet"
                  : "This chapter hasn't added any facilitators yet"
                }
              </p>
            </div>
          ) : (
            Object.entries(groupedFacilitators).map(([chapterId, chapterFacilitators]) => (
              <div key={chapterId} className="border rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold">{getChapterName(parseInt(chapterId), chapterFacilitators[0])}</h3>
                  <Badge variant="outline" className="ml-2">
                    {chapterFacilitators.length}/2 Facilitators
                  </Badge>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {chapterFacilitators
                    .sort((a, b) => a.position - b.position)
                    .map((facilitator) => (
                      <div
                        key={facilitator.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{facilitator.name}</span>
                            <Badge variant="outline">
                              Position {facilitator.position}
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {facilitator.phoneNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {chapterFacilitators.length < 2 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                    This chapter can add {2 - chapterFacilitators.length} more facilitator(s).
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(groupedFacilitators).length}
                </div>
                <div className="text-sm text-gray-600">Chapters with Facilitators</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {facilitators.filter(f => f.isActive).length}
                </div>
                <div className="text-sm text-gray-600">Total Active Facilitators</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((facilitators.filter(f => f.isActive).length / (chapters.length * 2)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Facilitator Completion Rate</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
