"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { RegistrationStats } from "./registration-stats"
import { RegistrationChart } from "./registration-chart"
import { RegistrationsTable } from "./registrations-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Download, 
  Calendar, 
  Clock, 
  BarChart3, 
  ListFilter, 
  TrendingUp, 
  User,
  AlertCircle 
} from "lucide-react"

export function CoordinatorDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [coordinator, setCoordinator] = useState<any>(null)
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch coordinator info from session
        const userResponse = await fetch('/api/auth/session')
        const userData = await userResponse.json()
        
        if (userData && userData.user && userData.user.chapterId) {
          setChapterId(userData.user.chapterId);
          setCoordinator(userData.user);
          
          // Fetch dashboard stats
          const statsResponse = await fetch(`/api/coordinator/dashboard/stats?chapterId=${userData.user.chapterId}`)
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          // Handle case where user data is not available
          toast({
            title: "Error",
            description: "Could not load user data. Please try logging in again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [chapterId, toast])
    const handleExportData = async () => {
    try {
      toast({
        title: "Preparing export...",
        description: "Please wait while we prepare your data export.",
      })
      
      const response = await fetch(`/api/coordinator/export?chapterId=${chapterId}`)
      
      if (!response.ok) {
        throw new Error("Export failed")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `napps-registrations-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "Registration data has been exported successfully.",
        variant: "success",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }
  
  // Get current date for display
  const today = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const formattedDate = today.toLocaleDateString('en-US', dateOptions)
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:justify-between md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{stats?.chapterName || "Chapter"} Dashboard</h1>
          </div>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleExportData} 
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Registrations
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Welcome, <span className="font-medium">{coordinator?.name || "Coordinator"}</span>
        </p>
      </div>
      
      {stats?.pendingPayments > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-medium">{stats.pendingPayments}</span> {stats.pendingPayments === 1 ? 'registration' : 'registrations'} with pending payment
            </p>
          </CardContent>
        </Card>
      )}
        <RegistrationStats 
        totalRegistrations={stats?.totalRegistrations} 
        pendingPayments={stats?.pendingPayments}
        confirmedRegistrations={stats?.confirmedRegistrations}
        totalSchools={stats?.totalSchools}
        totalCenters={stats?.totalCenters}
      />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-auto w-full">
          <TabsTrigger value="overview" onClick={() => setActiveTab("overview")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="registrations" onClick={() => setActiveTab("registrations")}>
            <ListFilter className="h-4 w-4 mr-2" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => setActiveTab("analytics")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Daily registration and payment counts</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <RegistrationChart chapterId={chapterId} />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest registrations from your chapter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">New registration from {['Primary 6', 'JSS 3', 'Primary 5', 'SSS 3'][i]}</p>
                        <div className="flex text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" /> 
                          <span>{i*15+5} minutes ago</span>
                        </div>
                      </div>
                      <Badge variant={Math.random() > 0.3 ? 'default' : 'outline'} className="ml-auto">
                        {Math.random() > 0.3 ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Registrations</CardTitle>
              <CardDescription>
                Manage and view all registrations from your chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationsTable chapterId={chapterId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Analytics</CardTitle>
              <CardDescription>
                View detailed registration trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationChart chapterId={chapterId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
