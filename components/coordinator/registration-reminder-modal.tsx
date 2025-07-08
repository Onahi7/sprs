"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, AlertTriangle, X } from "lucide-react"
import { useRegistrationCountdown } from "@/hooks/use-registration-countdown"

interface RegistrationReminderModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegistrationReminderModal({ isOpen, onClose }: RegistrationReminderModalProps) {
  const { timeLeft, isExpired, isInGracePeriod } = useRegistrationCountdown()

  const handleDontShowAgain = () => {
    localStorage.setItem('hideRegistrationReminder', 'true')
    onClose()
  }

  if (isExpired) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Registration Closed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-300">
                The registration period and grace period have both ended. No new registrations can be processed at this time.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${
            isInGracePeriod ? "text-orange-600" : "text-red-600"
          }`}>
            <AlertTriangle className="h-5 w-5" />
            {isInGracePeriod ? "Registration Grace Period" : "Registration Deadline Reminder"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            isInGracePeriod 
              ? "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700" 
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className={`h-4 w-4 ${
                isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
              }`} />
              <span className={`text-sm font-medium ${
                isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
              }`}>
                {isInGracePeriod 
                  ? "Grace period ends: July 10th, 2025 at 12:00 AM" 
                  : "Registration closes: July 8th, 2025 at 12:00 AM"
                }
              </span>
            </div>
            
            <div className="text-center">
              <div className={`text-sm mb-2 ${
                isInGracePeriod ? "text-orange-700 dark:text-orange-400" : "text-red-700 dark:text-red-400"
              }`}>
                {isInGracePeriod ? "Grace period remaining:" : "Time remaining:"}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className={`text-xl font-bold font-mono ${
                    isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
                  }`}>
                    {timeLeft.days}
                  </div>
                  <div className={`text-xs uppercase ${
                    isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    Days
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold font-mono ${
                    isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
                  }`}>
                    {timeLeft.hours}
                  </div>
                  <div className={`text-xs uppercase ${
                    isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    Hours
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold font-mono ${
                    isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
                  }`}>
                    {timeLeft.minutes}
                  </div>
                  <div className={`text-xs uppercase ${
                    isInGracePeriod ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    Minutes
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold font-mono ${
                    isInGracePeriod ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"
                  }`}>
                    {timeLeft.seconds}
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Important:</strong> {isInGracePeriod 
                  ? "You are now in the 48-hour grace period! Complete all registrations before the final deadline. No registrations will be accepted after the grace period ends."
                  : "Make sure all your student registrations are completed before the deadline. A 48-hour grace period will follow, but it's better to register before the original deadline."
                }
              </p>
            </div></div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Important:</strong> Make sure all your student registrations are completed before the deadline. 
                No registrations will be accepted after this time.
              </p>
            </div>
          </div>
          
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={handleDontShowAgain} className="text-sm">
              Don't show again
            </Button>
            <Button onClick={onClose}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
