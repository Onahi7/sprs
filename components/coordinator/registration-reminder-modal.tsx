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
  const { timeLeft, isExpired } = useRegistrationCountdown()

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
                The registration period has ended. No new registrations can be processed at this time.
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Registration Deadline Reminder
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-800 dark:text-red-300">
                Registration closes: July 8th, 2025 at 12:00 AM
              </span>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-red-700 dark:text-red-400 mb-2">Time remaining:</div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-red-800 dark:text-red-300 font-mono">
                    {timeLeft.days}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 uppercase">
                    Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-800 dark:text-red-300 font-mono">
                    {timeLeft.hours}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 uppercase">
                    Hours
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-800 dark:text-red-300 font-mono">
                    {timeLeft.minutes}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 uppercase">
                    Minutes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-800 dark:text-red-300 font-mono">
                    {timeLeft.seconds}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 uppercase">
                    Seconds
                  </div>
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
