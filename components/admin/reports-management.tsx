"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, BarChart3, PieChart, TrendingUp, Map, Filter, RefreshCw, FileText } from "lucide-react"
import { Bar, Pie, Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { DatePickerWithRange } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReportsTable } from "@/components/admin/reports-table"
import { ReportsSummary } from "@/components/admin/reports-summary"
import { Badge } from "@/components/ui/badge"
import { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Define types
type ReportData = {
  chapterName: string
  pending: number
  approved: number
  rejected: number
  paid: number
  unpaid: number
}

type TrendData = {
  date: string
  registrations: number
}

type ChartData = {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
    tension?: number
  }[]
}

interface ReportFilters {
  dateRange?: DateRange
  chapterId?: string
  schoolId?: string
  paymentStatus?: string
  registrationType?: string
  searchTerm?: string
}

interface Chapter {
  id: string
  name: string
}

interface School {
  id: string
  name: string
  chapter_name: string
}

interface DetailedReportData {
  registrations: any[]
  summary: {
    totalRegistrations: number
    paidRegistrations: number
    pendingRegistrations: number
    byChapter: { [key: string]: number }
    bySchool: { [key: string]: number }
    byPaymentStatus: { [key: string]: number }
  }
}

export function ReportsManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("detailed")
  const [timeRange, setTimeRange] = useState<string>("month")
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [trendChartData, setTrendChartData] = useState<ChartData | null>(null)
  const [exporting, setExporting] = useState(false)
  
  // New detailed report state
  const [detailedReportData, setDetailedReportData] = useState<DetailedReportData | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: addDays(new Date(), -30),
      to: new Date()
    }
  })
    useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (chapters.length > 0) {
      if (reportType === "detailed") {
        fetchDetailedReportData()
      } else {
        fetchLegacyReportData()
      }
    }
  }, [filters, chapters, reportType, selectedChapter, timeRange])

  const fetchInitialData = async () => {
    try {
      // Fetch chapters
      const chaptersRes = await fetch('/api/admin/chapters')
      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json()
        setChapters(chaptersData.chapters || chaptersData)
      }

      // Fetch schools
      const schoolsRes = await fetch('/api/admin/schools')
      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json()
        setSchools(schoolsData.schools || schoolsData)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const fetchDetailedReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.dateRange?.from) {
        params.append('startDate', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        params.append('endDate', filters.dateRange.to.toISOString())
      }
      if (filters.chapterId) {
        params.append('chapterId', filters.chapterId)
      }
      if (filters.schoolId) {
        params.append('schoolId', filters.schoolId)
      }
      if (filters.paymentStatus) {
        params.append('paymentStatus', filters.paymentStatus)
      }
      if (filters.registrationType) {
        params.append('registrationType', filters.registrationType)
      }
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm)
      }

      const response = await fetch(`/api/admin/reports?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDetailedReportData(data)
      }
    } catch (error) {
      console.error('Error fetching detailed report data:', error)
      toast({
        title: "Error",
        description: "Failed to load detailed report data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }  
  const fetchLegacyReportData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        chapter: selectedChapter,
        type: reportType,
        timeRange: timeRange
      })
      
      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`)
      const data = await res.json()
      
      if (data.reportData) {
        // Map backend fields to expected frontend fields
        const mappedReportData = data.reportData.map((item: any) => ({
          chapterName: item.chapter_name || 'Unknown',
          pending: Number(item.pending) || 0,
          approved: Number(item.completed) || 0, // 'completed' from backend is 'approved' in frontend
          rejected: 0, // No rejected in schema
          paid: Number(item.completed) || 0, // 'completed' is also 'paid'
          unpaid: Number(item.pending) || 0, // 'pending' is also 'unpaid'
          public: Number(item.public_registrations) || 0,
          coordinator: Number(item.coordinator_registrations) || 0,
          total: Number(item.total_registrations) || 0
        }))
        setReportData(mappedReportData)
        
        // Create chart data based on report type
        if (reportType === "status") {
          const statusChartData: ChartData = {
            labels: data.reportData.map((item: ReportData) => item.chapterName),
            datasets: [
              {
                label: 'Pending',
                data: data.reportData.map((item: ReportData) => item.pending),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
              },
              {
                label: 'Approved',
                data: data.reportData.map((item: ReportData) => item.approved),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
              },
              {
                label: 'Rejected',
                data: data.reportData.map((item: ReportData) => item.rejected),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
              }
            ]
          }
          setChartData(statusChartData)
        } else if (reportType === "payment") {
          const paymentChartData: ChartData = {
            labels: ['Paid', 'Unpaid'],
            datasets: [
              {
                label: 'Payment Status',
                data: [
                  data.reportData.reduce((sum: number, item: ReportData) => sum + item.paid, 0),
                  data.reportData.reduce((sum: number, item: ReportData) => sum + item.unpaid, 0)
                ],
                backgroundColor: [
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(255, 99, 132, 0.6)'
                ],
                borderColor: [
                  'rgb(75, 192, 192)',
                  'rgb(255, 99, 132)'
                ],
                borderWidth: 1
              }
            ]
          }
          setChartData(paymentChartData)
        } else if (reportType === "trend" && data.trendData) {
          setTrendData(data.trendData)
          
          const trendChartData: ChartData = {
            labels: data.trendData.map((item: TrendData) => item.date),
            datasets: [
              {
                label: 'Daily Registrations',
                data: data.trendData.map((item: TrendData) => item.registrations),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
                fill: true
              }
            ]
          }
          setTrendChartData(trendChartData)
        }
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      params.append('format', 'pdf')
      
      if (reportType === "detailed") {
        // Export detailed report
        if (filters.dateRange?.from) {
          params.append('startDate', filters.dateRange.from.toISOString())
        }
        if (filters.dateRange?.to) {
          params.append('endDate', filters.dateRange.to.toISOString())
        }
        if (filters.chapterId) {
          params.append('chapterId', filters.chapterId)
        }
        if (filters.schoolId) {
          params.append('schoolId', filters.schoolId)
        }
        if (filters.paymentStatus) {
          params.append('paymentStatus', filters.paymentStatus)
        }
        if (filters.registrationType) {
          params.append('registrationType', filters.registrationType)
        }
        if (filters.searchTerm) {
          params.append('search', filters.searchTerm)
        }
      } else {
        // Export legacy report
        params.append('chapter', selectedChapter)
        params.append('type', reportType)
        params.append('timeRange', timeRange)
      }

      const response = await fetch(`/api/admin/reports/export?${params.toString()}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `registration-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Success",
          description: "Report exported successfully as PDF",
        })
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast({
        title: "Error",
        description: "Failed to export PDF report",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  async function handleExport() {
    try {
      const queryParams = new URLSearchParams({
        chapter: selectedChapter,
        type: reportType,
        timeRange: timeRange,
        format: 'csv'
      })
      
      const res = await fetch(`/api/admin/reports/export?${queryParams.toString()}`)
      
      if (!res.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${reportType}-report-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Success",
        description: "Report exported successfully",
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    }
  }

  const resetFilters = () => {
    setFilters({
      dateRange: {
        from: addDays(new Date(), -30),
        to: new Date()
      }
    })
  }

  const filteredSchools = filters.chapterId 
    ? schools.filter(school => school.chapter_name === chapters.find(c => c.id === filters.chapterId)?.name)
    : schools
  const timeRangeOptions = [
    { label: "Last 7 days", value: "week" },
    { label: "Last 30 days", value: "month" },
    { label: "Last 90 days", value: "quarter" },
    { label: "This year", value: "year" },
    { label: "All time", value: "all" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Registration Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive analysis of registration data with export capabilities</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={reportType === "detailed" ? fetchDetailedReportData : fetchLegacyReportData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList>
          <TabsTrigger value="detailed" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Detailed Reports
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Status Report
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1">
            <PieChart className="h-4 w-4" />
            Payment Report
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Registration Trends
          </TabsTrigger>
          <TabsTrigger value="geographic" className="flex items-center gap-1">
            <Map className="h-4 w-4" />
            Geographic Distribution
          </TabsTrigger>
        </TabsList>

        {/* Detailed Reports Tab */}
        <TabsContent value="detailed" className="mt-6">
          {/* Filters Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
              <CardDescription>
                Customize your report by applying filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={filters.dateRange}
                    setDate={(dateRange) => setFilters({ ...filters, dateRange })}
                  />
                </div>

                {/* Chapter Filter */}
                <div className="space-y-2">
                  <Label>Chapter</Label>                  <Select
                    value={filters.chapterId || 'all'}
                    onValueChange={(value) => setFilters({ 
                      ...filters, 
                      chapterId: value === "all" ? undefined : value,
                      schoolId: undefined // Reset school when chapter changes
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Chapters" />
                    </SelectTrigger>                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* School Filter */}
                <div className="space-y-2">
                  <Label>School</Label>                  <Select
                    value={filters.schoolId || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, schoolId: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Schools" />
                    </SelectTrigger>                    <SelectContent>
                      <SelectItem value="all">All Schools</SelectItem>
                      {filteredSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status Filter */}
                <div className="space-y-2">
                  <Label>Payment Status</Label>                  <Select
                    value={filters.paymentStatus || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === "all" ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by name, email..."
                    value={filters.searchTerm || ''}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null
                    if (key === 'dateRange' && value) {
                      const range = value as DateRange
                      if (range.from && range.to) {
                        return (                          <Badge key={key} variant="secondary">
                            {format(range.from, 'yyyy-MM-dd')} - {format(range.to, 'yyyy-MM-dd')}
                          </Badge>
                        )
                      }
                    }
                    if (key === 'chapterId' && value) {
                      const chapter = chapters.find(c => c.id === value)
                      return (
                        <Badge key={key} variant="secondary">
                          Chapter: {chapter?.name}
                        </Badge>
                      )
                    }
                    if (key === 'schoolId' && value) {
                      const school = schools.find(s => s.id === value)
                      return (
                        <Badge key={key} variant="secondary">
                          School: {school?.name}
                        </Badge>
                      )
                    }
                    if (typeof value === 'string') {
                      return (
                        <Badge key={key} variant="secondary">
                          {key}: {value}
                        </Badge>
                      )
                    }
                    return null
                  })}
                </div>
                <Button onClick={resetFilters} variant="ghost" size="sm">
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {detailedReportData && (
            <ReportsSummary summary={{ ...detailedReportData.summary, registrations: detailedReportData.registrations }} loading={loading} />
          )}

          {/* Data Table */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Registration Data
              </CardTitle>
              <CardDescription>
                Detailed registration records based on your filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detailedReportData && (
                <ReportsTable 
                  data={detailedReportData.registrations} 
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legacy Report Tabs */}
        <TabsContent value="status" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Reports</CardTitle>
              <CardDescription>Legacy status reporting with charts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="w-[180px]">
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
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {loading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <div className="h-[500px]">
                  {chartData && <Bar 
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: 'Registration Status by Chapter'
                        }
                      },
                      scales: {
                        x: {
                          stacked: false,
                        },
                        y: {
                          stacked: false
                        }
                      }
                    }}
                  />}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reports</CardTitle>
              <CardDescription>Payment status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="w-[180px]">
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
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {loading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="h-[400px] w-[400px]">
                    {chartData && <Pie 
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'right' as const,
                          },
                          title: {
                            display: true,
                            text: 'Payment Status Distribution'
                          }
                        }
                      }}
                    />}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trend" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Reports</CardTitle>
              <CardDescription>Registration trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="w-[180px]">
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
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {loading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <div className="h-[500px]">
                  {trendChartData && <Line 
                    data={trendChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: `Registration Trends (${timeRangeOptions.find(o => o.value === timeRange)?.label || timeRange})`
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="geographic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Registration distribution by location</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <div className="h-[500px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Geographic distribution visualization would be displayed here</p>
                    <p className="text-sm mt-2">This would typically use a map visualization library</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Legacy Summary Cards for non-detailed views */}
      {reportType !== "detailed" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Summary</CardTitle>
              <CardDescription>Key metrics for all registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-amber-800 dark:text-amber-300 text-sm font-medium">Pending Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.pending) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.pending) || 0), 0) : 0}</p>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <h3 className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Approved Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.paid) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.paid) || 0), 0) : 0}</p>
                  </div>
                  
                  <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                    <h3 className="text-rose-800 dark:text-rose-300 text-sm font-medium">Rejected Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.rejected) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.rejected) || 0), 0) : 0}</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-blue-800 dark:text-blue-300 text-sm font-medium">Total Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.pending) || 0) + (Number(item.approved) || 0) + (Number(item.rejected) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.pending) || 0) + (Number(item.approved) || 0) + (Number(item.rejected) || 0), 0) : 0}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Financial metrics and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <h3 className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Paid Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.paid) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.paid) || 0), 0) : 0}</p>
                  </div>
                  
                  <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                    <h3 className="text-rose-800 dark:text-rose-300 text-sm font-medium">Unpaid Registrations</h3>
                    <p className="text-2xl font-bold mt-2">{Number.isFinite(reportData.reduce((sum, item) => sum + (Number(item.unpaid) || 0), 0)) ? reportData.reduce((sum, item) => sum + (Number(item.unpaid) || 0), 0) : 0}</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-900 col-span-2">
                    <h3 className="text-green-800 dark:text-green-300 text-sm font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold mt-2">₦{Number.isFinite(reportData.reduce((sum, item) => sum + ((Number(item.paid) || 0) * 5000), 0)) ? reportData.reduce((sum, item) => sum + ((Number(item.paid) || 0) * 5000), 0).toLocaleString() : '0'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
