"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  School, 
  CreditCard, 
  TrendingUp, 
  Building, 
  ArrowUpRight, 
  ArrowDownRight,
  MapPin 
} from "lucide-react"

interface RegistrationStatsProps {
  totalRegistrations: number
  pendingPayments: number
  confirmedRegistrations: number
  totalSchools: number
  totalCenters: number
}

export function RegistrationStats({
  totalRegistrations = 0,
  pendingPayments = 0,
  confirmedRegistrations = 0,
  totalSchools = 0,
  totalCenters = 0
}: RegistrationStatsProps) {
  // Calculate percentage of confirmed registrations
  const confirmationRate = totalRegistrations > 0 
    ? Math.round((confirmedRegistrations / totalRegistrations) * 100) 
    : 0
  
  // Simulate growth rates for visualization
  const registrationGrowth = 12 // 12% growth from previous period
  const schoolsGrowth = 4 // 4% growth from previous period

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalRegistrations.toLocaleString()}</div>
          <div className="mt-1 flex items-center text-xs">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-green-500">{registrationGrowth}% increase</span>
            <span className="ml-1 text-muted-foreground"> from last week</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1 items-center">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Paid: {confirmedRegistrations}</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              <span>Pending: {pendingPayments}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{confirmationRate}%</div>
          <div className="mt-1 flex items-center text-xs">
            <span className="text-muted-foreground">Payment completion rate</span>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${confirmationRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{confirmedRegistrations} paid</span>
              <span>{pendingPayments} pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Schools & Centers</CardTitle>
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
            <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Schools</div>
              <div className="text-2xl font-bold">{totalSchools}</div>
              <div className="flex items-center text-xs mt-1">
                <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">{schoolsGrowth}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Centers</div>
              <div className="text-2xl font-bold">{totalCenters}</div>
              <div className="flex items-center text-xs mt-1">
                <MapPin className="mr-1 h-3 w-3 text-purple-500" />
                <span>Exam venues</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
              <p className="text-xs text-muted-foreground">Students registered in your chapter</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.completedPayments || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats && stats.totalRegistrations > 0
                  ? `${Math.round((stats.completedPayments / stats.totalRegistrations) * 100)}% of total registrations`
                  : "0% of total registrations"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Schools</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.totalSchools || 0}</div>
              <p className="text-xs text-muted-foreground">Schools participating in your chapter</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Centers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.totalCenters || 0}</div>
              <p className="text-xs text-muted-foreground">Exam centers in your chapter</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
