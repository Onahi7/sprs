"use client"

import { Clock, Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRegistrationCountdown } from "@/hooks/use-registration-countdown"

interface RegistrationCountdownProps {
  className?: string
  compact?: boolean
}

export function RegistrationCountdown({ className, compact = false }: RegistrationCountdownProps) {
  const { timeLeft, isExpired, isInGracePeriod } = useRegistrationCountdown()

  if (isExpired) {
    return (
      <div className={cn(
        "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300 font-medium">
            Registration has closed (Grace period ended)
          </span>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn(
        isInGracePeriod 
          ? "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700" 
          : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700",
        "rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <Clock className={cn(
            "h-4 w-4",
            isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
          )} />
          <span className={cn(
            "text-sm font-medium",
            isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
          )}>
            {isInGracePeriod ? "Grace period" : "Registration closes in"}: <span className="font-mono">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      isInGracePeriod 
        ? "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700" 
        : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700",
      "rounded-lg p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className={cn(
            "h-6 w-6",
            isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-lg font-semibold mb-2",
            isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
          )}>
            {isInGracePeriod ? "Registration Grace Period" : "Registration Deadline Approaching"}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={cn(
              "h-4 w-4",
              isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
            )} />
            <span className={cn(
              "text-sm",
              isInGracePeriod ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"
            )}>
              {isInGracePeriod 
                ? "Grace period ends: July 10th, 2025 at 12:00 AM (Original deadline was July 8th)" 
                : "Closes: July 8th, 2025 at 12:00 AM (48-hour grace period follows)"
              }
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold font-mono",
                isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
              )}>
                {timeLeft.days}
              </div>
              <div className={cn(
                "text-xs uppercase tracking-wide",
                isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
              )}>
                Days
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold font-mono",
                isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
              )}>
                {timeLeft.hours}
              </div>
              <div className={cn(
                "text-xs uppercase tracking-wide",
                isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
              )}>
                Hours
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold font-mono",
                isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
              )}>
                {timeLeft.minutes}
              </div>
              <div className={cn(
                "text-xs uppercase tracking-wide",
                isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
              )}>
                Minutes
              </div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold font-mono",
                isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
              )}>
                {timeLeft.seconds}
              </div>
              <div className={cn(
                "text-xs uppercase tracking-wide",
                isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
              )}>
                Seconds
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
