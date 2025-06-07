"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, TrendingUp, Users, Clock } from "lucide-react"

interface SlotBalanceDisplayProps {
  slots?: {
    availableSlots: number
    usedSlots: number
    totalPurchasedSlots: number
    lastPurchaseDate?: Date
    lastUsageDate?: Date
  }
  loading?: boolean
  className?: string
}

export function SlotBalanceDisplay({ slots, loading, className }: SlotBalanceDisplayProps) {
  if (loading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!slots) {
    return null
  }

  const efficiency = slots.totalPurchasedSlots > 0 
    ? Math.round((slots.usedSlots / slots.totalPurchasedSlots) * 100) 
    : 0

  const isLowBalance = slots.availableSlots <= 5
  const isOutOfSlots = slots.availableSlots === 0

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Available Slots */}
      <Card className={isOutOfSlots ? "border-red-200 bg-red-50" : isLowBalance ? "border-yellow-200 bg-yellow-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Slots</CardTitle>
          <CreditCard className={`h-4 w-4 ${isOutOfSlots ? "text-red-500" : isLowBalance ? "text-yellow-500" : "text-green-500"}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {slots.availableSlots}
            {isLowBalance && (
              <Badge variant={isOutOfSlots ? "destructive" : "secondary"} className="ml-2 text-xs">
                {isOutOfSlots ? "Empty" : "Low"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isOutOfSlots 
              ? "Purchase slots to register students" 
              : isLowBalance 
                ? "Consider purchasing more slots"
                : "Ready for registrations"
            }
          </p>
        </CardContent>
      </Card>

      {/* Used Slots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Used Slots</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{slots.usedSlots}</div>
          <p className="text-xs text-muted-foreground">
            Students registered via slots
          </p>
        </CardContent>
      </Card>

      {/* Total Purchased */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Purchased</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{slots.totalPurchasedSlots}</div>
          <p className="text-xs text-muted-foreground">
            All-time slot purchases
          </p>
        </CardContent>
      </Card>

      {/* Efficiency */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usage Efficiency</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {efficiency}%
            <Badge 
              variant={efficiency >= 80 ? "default" : efficiency >= 50 ? "secondary" : "outline"} 
              className="ml-2 text-xs"
            >
              {efficiency >= 80 ? "Excellent" : efficiency >= 50 ? "Good" : "Low"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Slots utilized effectively
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
