import { AdminDashboard } from "@/components/admin/dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  console.log("AdminPage: Fetching session...")
  const session = await getSession()
  console.log("AdminPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminPage: Rendering AdminDashboard component")
  return <AdminDashboard />
}
