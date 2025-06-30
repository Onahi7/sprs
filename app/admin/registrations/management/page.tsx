import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdvancedRegistrationsManagement } from "@/components/admin/advanced-registrations-management"

export default async function AdvancedRegistrationsManagementPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }
  
  return (
    <div className="container mx-auto py-6">
      <AdvancedRegistrationsManagement />
    </div>
  )
}
