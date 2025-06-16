"use client"

import { useState, type ReactNode } from "react"
import { CoordinatorSidebar } from "./coordinator-sidebar"
import { CoordinatorMobileHeader } from "./coordinator-mobile-header"

export function CoordinatorLayoutClient({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <div className="flex-1 md:p-8 p-3 pt-20 md:pt-8">
        {children}
      </div>
    </div>
  )
}
