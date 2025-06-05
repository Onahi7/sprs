import { RegistrationsManagement } from "@/components/coordinator/registrations-management"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorRegistrationsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return <RegistrationsManagement />
}
