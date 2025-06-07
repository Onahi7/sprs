import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
// Importing component by explicit file extension to satisfy module resolution
import { SlotsManagement } from "../../../components/coordinator/slots-management"

export default async function CoordinatorSlotsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Slot Management</h1>
        <p className="text-muted-foreground">
          Purchase slots to register students directly from your coordinator portal
        </p>
      </div>
      
      <SlotsManagement />
    </div>
  )
}
