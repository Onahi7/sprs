import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SchoolsManagement } from "@/components/admin/schools-management"

export default async function AdminSchoolsPage() {
  console.log("AdminSchoolsPage: Fetching session...")
  const session = await getSession()
  console.log("AdminSchoolsPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminSchoolsPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminSchoolsPage: Rendering Schools Management component")
  return <SchoolsManagement />
}
