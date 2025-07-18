"use client"

import { useState, useEffect, type ReactNode } from "react"
import { CoordinatorSidebar } from "./coordinator-sidebar"
import { CoordinatorMobileHeader } from "./coordinator-mobile-header"
import { RegistrationCountdown } from "./registration-countdown"
import { RegistrationReminderModal } from "./registration-reminder-modal"

export function CoordinatorLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)

  useEffect(() => {
    // Check if we should show the reminder modal
    const hideReminder = localStorage.getItem('hideRegistrationReminder')
    const lastShown = localStorage.getItem('lastReminderShown')
    const today = new Date().toDateString()
    
    // Show modal if:
    // 1. User hasn't opted to hide it permanently
    // 2. It hasn't been shown today already
    // 3. We're still before the deadline
    const deadline = new Date('2025-07-08T00:00:00')
    const now = new Date()
    
    if (!hideReminder && lastShown !== today && now < deadline) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowReminderModal(true)
        localStorage.setItem('lastReminderShown', today)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Header */}
      <CoordinatorMobileHeader 
        onMenuClick={() => setSidebarOpen(true)}
      />
        {/* Sidebar */}
      <CoordinatorSidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main Content */}
      <div className="flex-1 md:p-8 p-3 pt-24 md:pt-8 md:ml-64">
        {/* Registration Countdown Banner */}
        <div className="mb-6">
          <RegistrationCountdown compact />
        </div>
        
        {children}
      </div>
      
      {/* Registration Reminder Modal */}
      <RegistrationReminderModal 
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </div>
  )
}
