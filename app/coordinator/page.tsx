import { CoordinatorDashboard } from "@/components/coordinator/dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return <CoordinatorDashboard />
}
