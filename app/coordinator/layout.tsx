import type { ReactNode } from "react"
import { CoordinatorSidebar } from "@/components/coordinator/coordinator-sidebar"

export default function CoordinatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <CoordinatorSidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
