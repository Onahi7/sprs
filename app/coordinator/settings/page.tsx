import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorSettings } from "@/components/coordinator/coordinator-settings"

export default async function CoordinatorSettingsPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your coordinator account settings and preferences
        </p>
      </div>
      
      <CoordinatorSettings />
    </div>
  )
}
