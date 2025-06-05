import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CentersManagement } from "@/components/admin/centers-management"

export default async function AdminCentersPage() {
  console.log("AdminCentersPage: Fetching session...")
  const session = await getSession()
  console.log("AdminCentersPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminCentersPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminCentersPage: Rendering Centers Management component")
  return <CentersManagement />
}
