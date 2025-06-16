"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface CoordinatorMobileHeaderProps {
  onMenuClick: () => void
}

export function CoordinatorMobileHeader({ onMenuClick }: CoordinatorMobileHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-gray-950 border-b h-16 flex items-center justify-between px-4 shadow-sm">
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

      {/* Placeholder for potential right-side actions */}
      <div className="w-10 flex-shrink-0"></div>
    </div>
  )
}
