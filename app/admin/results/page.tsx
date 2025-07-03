"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Users, FileText, BarChart3, Loader2 } from "lucide-react"
import Link from "next/link"

interface ResultSummary {
  totalRegistrations: number
  totalWithResults: number
  totalWithoutResults: number
  chaptersSummary: Array<{
    id: number
    name: string
    totalRegistrations: number
    withResults: number
    withoutResults: number
    centers: Array<{
      id: number
      name: string
      totalRegistrations: number
      withResults: number
      withoutResults: number
      topPerformers: Array<{
        registrationNumber: string
        studentName: string
        totalScore: number
        averagePercentage: number
      }>
    }>
  }>
}

export default function AdminResultsPage() {
  const [summary, setSummary] = useState<ResultSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [downloadingBulk, setDownloadingBulk] = useState(false)

  useEffect(() => {
    fetchResultsSummary()
  }, [])

  const fetchResultsSummary = async () => {
    try {
      const response = await fetch('/api/admin/results/summary')
      if (!response.ok) throw new Error('Failed to fetch results summary')
      
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Error fetching results summary:', error)
      setError('Failed to load results summary')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDownload = async (type: 'all' | 'chapter' | 'center', id?: number) => {
    setDownloadingBulk(true)
    try {
      let url = '/api/admin/results/bulk-download'
      if (type === 'chapter' && id) {
        url += `?chapterId=${id}`
      } else if (type === 'center' && id) {
        url += `?centerId=${id}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to generate bulk download')

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `results-bulk-${type}-${id || 'all'}-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading bulk results:', error)
      alert('Failed to download bulk results')
    } finally {
      setDownloadingBulk(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Failed to load results"}</p>
          <Button onClick={fetchResultsSummary}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Results Management</h1>
          <p className="text-gray-600">Manage and download student results across all centers</p>
        </div>
        <Button 
          onClick={() => handleBulkDownload('all')}
          disabled={downloadingBulk}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {downloadingBulk ? 'Generating...' : 'Download All Results'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegistrations}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Results</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.totalWithResults}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.totalWithResults / summary.totalRegistrations) * 100).toFixed(1)}% complete
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.totalWithoutResults}</div>
            <p className="text-xs text-muted-foreground">
              {((summary.totalWithoutResults / summary.totalRegistrations) * 100).toFixed(1)}% pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.chaptersSummary.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chapters and Centers Breakdown */}
      <Tabs defaultValue="chapters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chapters">By Chapters</TabsTrigger>
          <TabsTrigger value="centers">By Centers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chapters" className="space-y-4">
          {summary.chaptersSummary.map((chapter) => (
            <Card key={chapter.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">{chapter.name}</CardTitle>
                    <CardDescription>
                      {chapter.totalRegistrations} total registrations • {chapter.withResults} with results
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleBulkDownload('chapter', chapter.id)}
                      disabled={downloadingBulk}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Chapter
                    </Button>
                    <Badge variant={chapter.withResults === chapter.totalRegistrations ? "default" : "secondary"}>
                      {((chapter.withResults / chapter.totalRegistrations) * 100).toFixed(1)}% Complete
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chapter.centers.map((center) => (
                    <div key={center.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{center.name}</h4>
                          <p className="text-sm text-gray-600">
                            {center.totalRegistrations} students • {center.withResults} with results
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleBulkDownload('center', center.id)}
                            disabled={downloadingBulk}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Badge variant={center.withResults === center.totalRegistrations ? "default" : "secondary"}>
                            {center.withResults}/{center.totalRegistrations}
                          </Badge>
                        </div>
                      </div>
                      
                      {center.topPerformers.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Top 10 Performers:</h5>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {center.topPerformers.slice(0, 10).map((performer, index) => (
                              <div key={performer.registrationNumber} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                <div>
                                  <span className="font-medium">#{index + 1} {performer.studentName}</span>
                                  <br />
                                  <span className="text-gray-600">{performer.registrationNumber}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">{performer.totalScore}</div>
                                  <div className="text-xs text-gray-500">{performer.averagePercentage.toFixed(1)}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="centers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.chaptersSummary.flatMap(chapter => 
              chapter.centers.map(center => (
                <Card key={center.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{center.name}</CardTitle>
                    <CardDescription>{chapter.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Total Students:</span>
                        <Badge variant="outline">{center.totalRegistrations}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">With Results:</span>
                        <Badge variant={center.withResults === center.totalRegistrations ? "default" : "secondary"}>
                          {center.withResults}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Completion:</span>
                        <Badge variant={center.withResults === center.totalRegistrations ? "default" : "secondary"}>
                          {((center.withResults / center.totalRegistrations) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleBulkDownload('center', center.id)}
                        disabled={downloadingBulk}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
