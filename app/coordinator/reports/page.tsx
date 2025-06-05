import { ReportsManagement } from "@/components/coordinator/reports-management"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorReportsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return <ReportsManagement />
}
