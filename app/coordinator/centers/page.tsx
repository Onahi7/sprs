import { CentersManagement } from "@/components/coordinator/centers-management"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorCentersPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return <CentersManagement />
}
