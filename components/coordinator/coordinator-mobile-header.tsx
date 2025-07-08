"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Menu, Clock } from "lucide-react"
import { useRegistrationCountdown } from "@/hooks/use-registration-countdown"

interface CoordinatorMobileHeaderProps {
  onMenuClick: () => void
}

export function CoordinatorMobileHeader({ onMenuClick }: CoordinatorMobileHeaderProps) {
  const { timeLeft, isExpired, isInGracePeriod } = useRegistrationCountdown()

  return (
    <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-950 border-b flex flex-col shadow-sm">
      {/* Countdown Banner for Mobile */}
      {!isExpired && (
        <div className={`border-b px-3 py-1 ${
          isInGracePeriod 
            ? "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700" 
            : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
        }`}>
          <div className="flex items-center justify-center gap-1">
            <Clock className={`h-3 w-3 ${
              isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
            }`} />
            <span className={`text-xs ${
              isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
            }`}>
              {isInGracePeriod ? "Grace period" : "Registration closes in"}: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
        </div>
      )}
      
      {/* Main Header */}
      <div className="h-16 flex items-center justify-between px-4">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="p-2 flex-shrink-0"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Logo/Title */}
        <div className="flex-1 text-center min-w-0">
          <h1 className="text-lg font-bold truncate">SPRS</h1>
          <p className="text-xs text-muted-foreground">Coordinator Portal</p>
        </div>

        {/* Countdown Badge for Mobile */}
        <div className="flex-shrink-0">
          {!isExpired && (
            <Badge 
              variant={isInGracePeriod ? "secondary" : "destructive"} 
              className="text-xs px-2 py-1"
            >
              {timeLeft.days}d
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
