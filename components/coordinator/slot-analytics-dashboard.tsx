"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Zap,
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Download
} from "lucide-react"

interface SlotAnalytics {
  period: {
    days: number
    startDate: string
    endDate: string
  }
  coordinator: {
    chapterId: number
    chapterName: string
    chapterCode: string
  }
  balance: {
    availableSlots: number
    usedSlots: number
    totalPurchasedSlots: number
    utilizationPercentage: number
  }
  purchases: {
    total: number
    successful: number
    pending: number
    failed: number
    totalSlotsPurchased: number
    totalAmountSpent: number
    successRate: number
  }
  usage: {
    total: number
    totalSlotsUsed: number
    registrations: number
    adjustments: number
    burnRate: number
    projectedRunout: number | null
  }
  trends: {
    dailyPattern: Array<{
      date: string
      slotsUsed: number
      usageCount: number
    }>
    averageDailyUsage: number
  }
  recent: {
    purchases: Array<{
      id: number
      reference: string
      slotsPurchased: number
      amountPaid: number
      paymentStatus: string
      purchaseDate: string
      packageName: string
    }>
    usage: Array<{
      id: number
      slotsUsed: number
      usageType: string
      notes: string | null
      createdAt: string
      registrationId: number | null
    }>
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export function SlotAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SlotAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchAnalytics = async (periodDays: string, showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const response = await fetch(`/api/coordinator/slots/analytics?period=${periodDays}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load slot analytics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics(period, false)
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    fetchAnalytics(newPeriod)
  }

  useEffect(() => {
    fetchAnalytics(period)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          Unable to load slot analytics. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  const isLowBalance = analytics.balance.availableSlots <= 5
  const isHighUtilization = analytics.balance.utilizationPercentage > 80
  const needsRefill = analytics.usage.projectedRunout && analytics.usage.projectedRunout <= 7

  // Prepare chart data
  const usageTypeData = [
    { name: 'Registrations', value: analytics.usage.registrations, color: COLORS[0] },
    { name: 'Adjustments', value: analytics.usage.adjustments, color: COLORS[1] },
  ]

  const paymentStatusData = [
    { name: 'Successful', value: analytics.purchases.successful, color: COLORS[0] },
    { name: 'Pending', value: analytics.purchases.pending, color: COLORS[1] },
    { name: 'Failed', value: analytics.purchases.failed, color: COLORS[2] },
  ]

  const dailyUsageData = analytics.trends.dailyPattern
    .slice(-14) // Last 14 days
    .reverse()
    .map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      slots: d.slotsUsed,
      count: d.usageCount
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Slot Analytics</h2>
          <p className="text-muted-foreground">
            {analytics.coordinator.chapterName} ({analytics.coordinator.chapterCode})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(isLowBalance || needsRefill) && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Action Required</AlertTitle>
          <AlertDescription className="text-orange-700">
            {isLowBalance && "You have 5 or fewer slots remaining. "}
            {needsRefill && `Based on current usage, your slots will run out in ${analytics.usage.projectedRunout} days. `}
            Consider purchasing more slots to avoid interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
            <Zap className={`h-4 w-4 ${isLowBalance ? 'text-orange-500' : 'text-blue-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.balance.availableSlots}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.balance.totalPurchasedSlots} total purchased
            </p>
            <Progress 
              value={analytics.balance.utilizationPercentage} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.balance.utilizationPercentage}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.usage.burnRate}</div>
            <p className="text-xs text-muted-foreground">slots per day</p>
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Avg: {analytics.trends.averageDailyUsage}/day
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.purchases.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.purchases.successful}/{analytics.purchases.total} successful
            </p>
            <div className="flex items-center gap-1 mt-2">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                ₦{analytics.purchases.totalAmountSpent.toLocaleString()} spent
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Runout</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.usage.projectedRunout ? `${analytics.usage.projectedRunout}d` : '∞'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.usage.projectedRunout ? 'days remaining' : 'sufficient for now'}
            </p>
            {analytics.usage.projectedRunout && analytics.usage.projectedRunout <= 14 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Refill Soon
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Usage Trend
            </CardTitle>
            <CardDescription>
              Slot usage over the last 14 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => [
                    value, 
                    name === 'slots' ? 'Slots Used' : 'Usage Count'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="slots" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Usage Breakdown
            </CardTitle>
            <CardDescription>
              How your slots are being used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-300">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={usageTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {usageTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {usageTypeData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                    <Badge variant="outline">{item.value}</Badge>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    Total Usage: {analytics.usage.total} transactions
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Slots: {analytics.usage.totalSlotsUsed} slots
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Recent Purchases</TabsTrigger>
          <TabsTrigger value="usage">Recent Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>
                Your latest slot purchases and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recent.purchases.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No purchases in the selected period
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.recent.purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{purchase.packageName}</span>
                          <Badge variant={
                            purchase.paymentStatus === 'success' ? 'default' :
                            purchase.paymentStatus === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {purchase.paymentStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {purchase.slotsPurchased} slots • ₦{purchase.amountPaid.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(purchase.purchaseDate).toLocaleDateString()} • 
                          Ref: {purchase.reference}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Usage</CardTitle>
              <CardDescription>
                How your slots have been used recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recent.usage.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No usage in the selected period
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics.recent.usage.map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {usage.usageType}
                          </Badge>
                          <span className="text-sm font-medium">
                            {usage.slotsUsed} slot{usage.slotsUsed !== 1 ? 's' : ''} used
                          </span>
                        </div>
                        {usage.notes && (
                          <div className="text-sm text-muted-foreground">
                            {usage.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(usage.createdAt).toLocaleString()}
                          {usage.registrationId && ` • Registration ID: ${usage.registrationId}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
