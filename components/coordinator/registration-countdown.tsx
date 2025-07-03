"use client"

import { Clock, Calendar, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRegistrationCountdown } from "@/hooks/use-registration-countdown"

interface RegistrationCountdownProps {
  className?: string
  compact?: boolean
}

export function RegistrationCountdown({ className, compact = false }: RegistrationCountdownProps) {
  const { timeLeft, isExpired } = useRegistrationCountdown()

  if (isExpired) {
    return (
      <div className={cn(
        "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300 font-medium">
            Registration has closed
          </span>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn(
        "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-300">
            Registration closes in: <span className="font-mono font-medium">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            Registration Deadline Approaching
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-400">
              Closes: July 8th, 2025 at 12:00 AM
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">
                {timeLeft.days}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
                Days
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">
                {timeLeft.hours}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
                Hours
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">
                {timeLeft.minutes}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
                Minutes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800 dark:text-red-300 font-mono">
                {timeLeft.seconds}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
                Seconds
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
