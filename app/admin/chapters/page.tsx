import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChaptersManagement } from "@/components/admin"

export default async function AdminChaptersPage() {
  console.log("AdminChaptersPage: Fetching session...")
  const session = await getSession()
  console.log("AdminChaptersPage: Session result:", JSON.stringify(session))
  
  if (!session || session.role !== "admin") {
    console.log("AdminChaptersPage: User not authenticated as admin, redirecting to login")
    redirect("/auth/login")
  }
  
  console.log("AdminChaptersPage: Rendering Chapters Management component")
  return <ChaptersManagement />
}
