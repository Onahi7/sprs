"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { AdminStats } from "./admin-stats"
import { AdminChart } from "./admin-chart"
import { AdminRegistrationsTable } from "./admin-registrations-table"
import { AdminResultsManagement } from "./admin-results-management"
import { SplitCodeManagement } from "./split-code-management"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Download, 
  RefreshCcw, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Clock,
  BarChart3,
  Database,
  Code
} from "lucide-react"
import { SqlImport } from "./sql-import"

export function AdminDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [verifying, setVerifying] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  
  useEffect(() => {    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch dashboard stats
        const statsResponse = await fetch(`/api/admin/dashboard/stats`)
        const statsData = await statsResponse.json()
        
        setStats(statsData)

        // Fetch recent activity
        const activityResponse = await fetch(`/api/admin/dashboard/recent-activity`)
        const activityData = await activityResponse.json()
        
        setRecentActivity(activityData)
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
    
    // Function to handle dashboard refresh events
    const handleRefreshDashboard = () => {
      fetchDashboardData();
    };

    // Add event listener for dashboard refresh
    window.addEventListener('refreshDashboardData', handleRefreshDashboard);
    
    // Initial data fetch
    fetchDashboardData()
    
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('refreshDashboardData', handleRefreshDashboard);
    };
  }, [toast])
    const handleExportData = async () => {
    try {
      toast({
        title: "Preparing export...",
        description: "Please wait while we prepare your data export.",
      })
      
      const response = await fetch(`/api/admin/export-registrations`)
      
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
  
  const handleVerifyPendingTransactions = async () => {
    try {
      setVerifying(true)
      
      toast({
        title: "Verifying payments...",
        description: "Checking all pending transactions with Paystack.",
      })
      
      const response = await fetch('/api/admin/verify-pending-transactions', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to verify pending transactions')
      }
      
      const data = await response.json()
      
      toast({
        title: "Verification complete",
        description: `Updated ${data.updatedCount} transactions. Refresh the page to see updated data.`,
        variant: "success",
      })
      
      // Refresh stats
      const statsResponse = await fetch(`/api/admin/dashboard/stats`)
      const statsData = await statsResponse.json()
      setStats(statsData)
      
    } catch (error) {
      console.error("Verification error:", error)
      toast({
        title: "Verification failed",
        description: "There was an error verifying transactions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={handleVerifyPendingTransactions} 
            disabled={verifying} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Verify Payments'}
          </Button>
          <Button 
            onClick={handleExportData} 
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>
      
      {stats?.pendingPayments > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-medium">{stats.pendingPayments}</span> pending {stats.pendingPayments === 1 ? 'payment' : 'payments'} requires verification
            </p>
          </CardContent>
        </Card>
      )}
      
      <AdminStats 
        totalRegistrations={stats?.totalRegistrations} 
        pendingPayments={stats?.pendingPayments}
        confirmedRegistrations={stats?.confirmedRegistrations}
        totalRevenue={stats?.totalRevenue}
        totalChapters={stats?.totalChapters}
        totalSchools={stats?.totalSchools}
      />
        <Tabs defaultValue="overview" className="space-y-4">        <TabsList className="grid grid-cols-6 md:w-auto w-full">
          <TabsTrigger value="overview" onClick={() => setActiveTab("overview")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="registrations" onClick={() => setActiveTab("registrations")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="results" onClick={() => setActiveTab("results")}>
            <Database className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="split-codes" onClick={() => setActiveTab("split-codes")}>
            <Code className="h-4 w-4 mr-2" />
            Split Codes
          </TabsTrigger>
          <TabsTrigger value="charts" onClick={() => setActiveTab("charts")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="imports" onClick={() => setActiveTab("imports")}>
            <Database className="h-4 w-4 mr-2" />
            Data Import
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Registration count by chapter for the past 30 days</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <AdminChart />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest registrations across all chapters</CardDescription>
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
                            {activity.studentName} from {activity.chapterName}
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
                Manage student registrations across all chapters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminRegistrationsTable />
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="results" className="space-y-4">
          <AdminResultsManagement />
        </TabsContent>

        <TabsContent value="split-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Split Code Management</CardTitle>
              <CardDescription>
                Manage split codes for coordinator slot packages across all chapters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SplitCodeManagement />
            </CardContent>
          </Card>
        </TabsContent>
          <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Analytics</CardTitle>
              <CardDescription>
                View registration trends with detailed metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminChart />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="imports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SqlImport />
            
            <Card>
              <CardHeader>
                <CardTitle>Import Instructions</CardTitle>
                <CardDescription>How to prepare your SQL files for import</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Preparing SQL Files</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Export data from your MySQL database as SQL</li>
                    <li>Make sure each file contains data for one table only</li>
                    <li>Files should contain INSERT statements</li>
                    <li>Select the appropriate table type when uploading</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Table Mapping</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Registrations</strong>: Student registration data</li>
                    <li><strong>Chapters</strong>: Chapter information</li>
                    <li><strong>Schools</strong>: School data</li>
                    <li><strong>Centers</strong>: Examination centers</li>
                    <li><strong>Coordinators</strong>: Chapter coordinator data</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md p-3">
                  <p className="text-sm">
                    <strong>Note:</strong> Imports work best when tables are imported in the correct order: 
                    Chapters → Schools/Centers → Coordinators → Registrations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
