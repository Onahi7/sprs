"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  CreditCard, 
  Map, 
  School, 
  Building, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminStatsProps {
  totalRegistrations: number
  pendingPayments: number
  confirmedRegistrations: number
  totalRevenue: number
  totalChapters: number
  totalSchools: number
}

export function AdminStats({
  totalRegistrations = 0,
  pendingPayments = 0,
  confirmedRegistrations = 0,
  totalRevenue = 0,
  totalChapters = 0,
  totalSchools = 0
}: AdminStatsProps) {
  // Calculate percentage of confirmed registrations
  const confirmationRate = totalRegistrations > 0 
    ? Math.round((confirmedRegistrations / totalRegistrations) * 100) 
    : 0
  
  // Simulate a comparison with previous period (+5% registrations, -2% revenue, etc.)
  const registrationGrowth = 5
  const revenueGrowth = -2
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {registrationGrowth > 0 ? (
              <>
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{registrationGrowth}% increase</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(registrationGrowth)}% decrease</span>
              </>
            )}
            <span className="ml-1 text-muted-foreground"> from last month</span>
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
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₦{totalRevenue.toLocaleString()}</div>
          <div className="mt-1 flex items-center text-xs">
            {revenueGrowth > 0 ? (
              <>
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">{revenueGrowth}% increase</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">{Math.abs(revenueGrowth)}% decrease</span>
              </>
            )}
            <span className="ml-1 text-muted-foreground"> from last month</span>
          </div>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1 items-center">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Payment Success Rate: {confirmationRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Chapters</CardTitle>
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
            <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalChapters}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Active chapters nationwide
          </div>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1 items-center">
              <School className="h-3 w-3" />
              <span>{totalSchools} schools registered</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-orange-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
            <School className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalChapters > 0 ? Math.round(totalRegistrations / totalChapters) : 0}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Registrations per chapter
          </div>
          <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1 items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>{totalChapters > 0 ? Math.round(totalSchools / totalChapters) : 0} schools per chapter</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
