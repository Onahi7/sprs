import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { QuickAccessMenu } from "@/components/admin/quick-access-menu"
import { getDuplicateRegistrationsCount } from "@/db/duplicate-utils"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Get duplicates count for sidebar
  const duplicatesCount = await getDuplicateRegistrationsCount()
  
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar duplicatesCount={duplicatesCount} />
      <div className="flex-1 p-8">{children}</div>
      <QuickAccessMenu />
    </div>
  )
}
