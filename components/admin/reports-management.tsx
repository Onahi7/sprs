"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, BarChart3, PieChart, TrendingUp, Map } from "lucide-react"
import { Bar, Pie, Line } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'

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

export function ReportsManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [chapters, setChapters] = useState<{ id: number, name: string }[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [reportType, setReportType] = useState<string>("status")
  const [timeRange, setTimeRange] = useState<string>("month")
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [trendChartData, setTrendChartData] = useState<ChartData | null>(null)
  
  useEffect(() => {
    // Fetch chapters
    async function fetchChapters() {
      try {
        const res = await fetch('/api/admin/chapters')
        const data = await res.json()
        
        if (data.chapters) {
          setChapters(data.chapters)
        }
      } catch (error) {
        console.error("Error fetching chapters:", error)
      }
    }
    
    fetchChapters()
  }, [])
  
  useEffect(() => {
    async function fetchReportData() {
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
          setReportData(data.reportData)
          
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
    
    fetchReportData()
  }, [selectedChapter, reportType, timeRange, toast])
  
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
  
  const timeRangeOptions = [
    { label: "Last 7 days", value: "week" },
    { label: "Last 30 days", value: "month" },
    { label: "Last 90 days", value: "quarter" },
    { label: "This year", value: "year" },
    { label: "All time", value: "all" }
  ]
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>View and export comprehensive registration reports</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <Tabs value={reportType} onValueChange={setReportType} className="w-full">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <TabsList>
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
              
                <div className="flex gap-2">
                  <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                    <SelectTrigger id="chapter" className="w-[180px]">
                      <SelectValue placeholder="Select Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chapters</SelectItem>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="timeRange" className="w-[180px]">
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
              </div>

              <TabsContent value="status" className="mt-2">
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
              </TabsContent>
              
              <TabsContent value="payment" className="mt-2">
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
              </TabsContent>
              
              <TabsContent value="trend" className="mt-2">
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
              </TabsContent>
              
              <TabsContent value="geographic" className="mt-2">
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
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
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
                  <p className="text-2xl font-bold mt-2">{reportData.reduce((sum, item) => sum + item.pending, 0)}</p>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <h3 className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">Approved Registrations</h3>
                  <p className="text-2xl font-bold mt-2">{reportData.reduce((sum, item) => sum + item.approved, 0)}</p>
                </div>
                
                <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                  <h3 className="text-rose-800 dark:text-rose-300 text-sm font-medium">Rejected Registrations</h3>
                  <p className="text-2xl font-bold mt-2">{reportData.reduce((sum, item) => sum + item.rejected, 0)}</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                  <h3 className="text-blue-800 dark:text-blue-300 text-sm font-medium">Total Registrations</h3>
                  <p className="text-2xl font-bold mt-2">
                    {reportData.reduce((sum, item) => sum + item.pending + item.approved + item.rejected, 0)}
                  </p>
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
                  <p className="text-2xl font-bold mt-2">{reportData.reduce((sum, item) => sum + item.paid, 0)}</p>
                </div>
                
                <div className="bg-rose-50 dark:bg-rose-950 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                  <h3 className="text-rose-800 dark:text-rose-300 text-sm font-medium">Unpaid Registrations</h3>
                  <p className="text-2xl font-bold mt-2">{reportData.reduce((sum, item) => sum + item.unpaid, 0)}</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-900 col-span-2">
                  <h3 className="text-green-800 dark:text-green-300 text-sm font-medium">Total Revenue</h3>
                  <p className="text-2xl font-bold mt-2">
                    ₦{reportData.reduce((sum, item) => sum + (item.paid * 5000), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
