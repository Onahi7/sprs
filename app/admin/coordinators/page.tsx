import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorsManagement } from "@/components/admin/coordinators-management"

export default async function AdminCoordinatorsPage() {
  console.log("AdminCoordinatorsPage: Fetching session...")
  const session = await getSession()
  console.log("AdminCoordinatorsPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminCoordinatorsPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminCoordinatorsPage: Rendering Coordinators Management component")
  return <CoordinatorsManagement />
}
