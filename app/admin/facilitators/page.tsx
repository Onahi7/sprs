import { AdminFacilitatorsView } from "@/components/admin/facilitators-view"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminFacilitatorsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chapter Facilitators</h1>
        <p className="text-gray-600">
          View and manage facilitators across all chapters
        </p>
      </div>
      <AdminFacilitatorsView />
    </div>
  )
}
