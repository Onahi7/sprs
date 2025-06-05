import { ReportsManagement } from "@/components/admin/reports-management"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminReportsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }
  
  return <ReportsManagement />
}
