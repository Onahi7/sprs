"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { RegistrationStats } from "./registration-stats"
import { RegistrationChart } from "./registration-chart"
import { RegistrationsTable } from "./registrations-table"
import { SplitTransactions } from "./split-transactions"
import { SlotBalanceDisplay } from "./slot-balance-display"
import { FacilitatorsManagement } from "./facilitators-management"
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
  AlertCircle,
  CreditCard,
  UserPlus,
  Users
} from "lucide-react"

export function CoordinatorDashboard() {  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [coordinator, setCoordinator] = useState<any>(null)
  const [chapterId, setChapterId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [slotData, setSlotData] = useState<any>(null)
  
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
          setStats(statsData)          // Fetch recent activity
          const activityResponse = await fetch(`/api/coordinator/dashboard/recent-activity?chapterId=${userData.user.chapterId}`)
          const activityData = await activityResponse.json()
          setRecentActivity(activityData)

          // Fetch slot data
          const slotResponse = await fetch('/api/coordinator/slots?action=balance')
          const slotResponseData = await slotResponse.json()
          setSlotData(slotResponseData.slots)
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
      
      const response = await fetch(`/api/coordinator/export?chapterId=${chapterId || 0}`)
      
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            asChild
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/coordinator/register">
              <UserPlus className="mr-2 h-4 w-4" />
              Register Student
            </Link>
          </Button>
          <Button 
            asChild
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600"
          >
            <Link href="/coordinator/facilitators">
              <Users className="mr-2 h-4 w-4" />
              Facilitators
            </Link>
          </Button>
          <Button 
            onClick={handleExportData} 
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Welcome, <span className="font-medium">{coordinator?.name || "Coordinator"}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-300">Register New Student</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Use your slot balance to register candidates</p>
              </div>
              <Button size="sm" asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/coordinator/register">
                  <UserPlus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-800 dark:text-purple-300">Manage Slots</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400">Purchase slots and view balance</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/coordinator/slots">
                  <CreditCard className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-800 dark:text-orange-300">View Registrations</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Track all student registrations</p>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/coordinator/registrations">
                  <ListFilter className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
      )}        <RegistrationStats 
        totalRegistrations={stats?.totalRegistrations} 
        pendingPayments={stats?.pendingPayments}
        confirmedRegistrations={stats?.confirmedRegistrations}
        totalSchools={stats?.totalSchools}
        totalCenters={stats?.totalCenters}
      />      {/* Slot Balance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Slot Balance</h2>
          <div className="flex gap-2">
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/coordinator/register">
                <UserPlus className="w-4 h-4 mr-2" />
                Register Student
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/coordinator/slots">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Slots
              </Link>
            </Button>
          </div>
        </div>
        <SlotBalanceDisplay slots={slotData} loading={loading} />
      </div>
        <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-auto w-full">
          <TabsTrigger value="overview" onClick={() => setActiveTab("overview")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="registrations" onClick={() => setActiveTab("registrations")}>
            <ListFilter className="h-4 w-4 mr-2" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="split-payments" onClick={() => setActiveTab("split-payments")}>
            <CreditCard className="h-4 w-4 mr-2" />
            Split Payments
          </TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => setActiveTab("analytics")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="facilitators" onClick={() => setActiveTab("facilitators")}>
            <User className="h-4 w-4 mr-2" />
            Facilitators
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Daily registration and payment counts</CardDescription>
              </CardHeader>              <CardContent className="px-2">
                <RegistrationChart chapterId={chapterId || 0} />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest registrations from your chapter</CardDescription>
              </CardHeader>              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No recent activity
                    </div>
                  ) : (
                    recentActivity.map((activity, i) => (
                      <div key={activity.id} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {activity.studentName} from {activity.schoolName}
                          </p>
                          <div className="flex text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" /> 
                            <span>{activity.timeAgo}</span>
                          </div>
                        </div>
                        <Badge variant={activity.paymentStatus === 'completed' ? 'default' : 'outline'} className="ml-auto">
                          {activity.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  )}
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
            </CardHeader>            <CardContent>
              <RegistrationsTable chapterId={chapterId || 0} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="split-payments" className="space-y-4">
          <SplitTransactions chapterId={chapterId || 0} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Analytics</CardTitle>
              <CardDescription>
                View detailed registration trends over time
              </CardDescription>
            </CardHeader>            <CardContent>
              <RegistrationChart chapterId={chapterId || 0} />
            </CardContent>
          </Card>
        </TabsContent>
          <TabsContent value="facilitators" className="space-y-4">
          <FacilitatorsManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
