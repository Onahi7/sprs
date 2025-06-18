import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSlotManagement } from "@/components/admin/slot-management"

export default async function AdminSlotsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }
  
  return <AdminSlotManagement />
}
