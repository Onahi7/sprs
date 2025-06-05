import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RegistrationsManagement } from "@/components/admin/registrations-management"

export default async function AdminRegistrationsPage() {
  console.log("AdminRegistrationsPage: Fetching session...")
  const session = await getSession()
  console.log("AdminRegistrationsPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminRegistrationsPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminRegistrationsPage: Rendering Registrations Management component")
  return <RegistrationsManagement />
}
