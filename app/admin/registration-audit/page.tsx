"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Download, FileText, Users, MapPin, Building2, CreditCard, Hash } from "lucide-react"
import { Spinner } from "@/components/shared/spinner"
import { toast } from "sonner"

interface Chapter {
  id: number
  name: string
  slotRegistrationCount: number
  singularRegistrationCount: number
  totalRegistrationCount: number
  totalSlotsSold: number
  totalRevenue: number
}

interface AuditSummary {
  totalChapters: number
  totalSlotRegistrations: number
  totalSingularRegistrations: number
  totalRegistrations: number
  totalSlotsSold: number
  totalRevenue: number
}

export default function RegistrationAuditPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [summary, setSummary] = useState<AuditSummary | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Load audit data
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const response = await fetch('/api/admin/registration-audit/data')
        if (!response.ok) throw new Error('Failed to fetch audit data')
        
        const data = await response.json()
        setChapters(data.chapters)
        setSummary(data.summary)
      } catch (error) {
        console.error('Error fetching audit data:', error)
        toast.error('Failed to load audit data')
      } finally {
        setLoading(false)
      }
    }

    fetchAuditData()
  }, [])

  const selectedChapterData = chapters.find(ch => ch.id.toString() === selectedChapter)

  const handleGenerateReport = async () => {
    if (selectedChapter === "all") {
      toast.error('Please select a specific chapter to generate report')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/admin/registration-audit/generate?chapterId=${selectedChapter}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate audit report')
      }

      // Download the PDF
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      const fileName = `registration_audit_${selectedChapterData?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Audit report generated successfully!')
    } catch (error) {
      console.error('Error generating audit report:', error)
      toast.error('Failed to generate audit report')
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
          <h1 className="text-3xl font-bold tracking-tight">Registration Audit</h1>
          <p className="text-muted-foreground">
            Audit registration data, slot sales, and generate detailed reports
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Search className="w-4 h-4 mr-2" />
          Audit System
        </Badge>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{summary.totalChapters}</p>
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
                  <p className="text-2xl font-bold">{summary.totalSlotsSold}</p>
                  <p className="text-sm text-muted-foreground">Total Slots Sold</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{summary.totalRegistrations}</p>
                  <p className="text-sm text-muted-foreground">Total Registrations</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Generate Report
              </CardTitle>
              <CardDescription>
                Select a chapter to generate detailed audit report
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
                    <SelectItem value="all">All Chapters (Summary)</SelectItem>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{chapter.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {chapter.totalRegistrationCount} total
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateReport}
                disabled={selectedChapter === "all" || generating}
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
                    Generate Audit Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Chapter Info */}
          {selectedChapter && selectedChapter !== "all" && selectedChapterData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Chapter Audit Summary
                </CardTitle>
                <CardDescription>
                  Detailed breakdown for {selectedChapterData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Slot Registrations</p>
                      <p className="text-2xl font-bold text-green-600">{selectedChapterData.slotRegistrationCount}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Singular Registrations</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedChapterData.singularRegistrationCount}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Slots Sold</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedChapterData.totalSlotsSold}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
                      <p className="text-2xl font-bold text-orange-600">{selectedChapterData.totalRegistrationCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Chapters Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Chapters Overview
              </CardTitle>
              <CardDescription>
                Registration and slot data for all chapters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{chapter.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Slots: {chapter.slotRegistrationCount}</span>
                        <span>Singular: {chapter.singularRegistrationCount}</span>
                        <span>Total: {chapter.totalRegistrationCount}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{chapter.totalSlotsSold}</p>
                      <p className="text-sm text-muted-foreground">Slots Sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
