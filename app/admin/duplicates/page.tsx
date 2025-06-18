import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminDuplicateManagement } from "@/components/admin/duplicate-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default async function AdminDuplicatesPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Duplicate Registrations
          </h1>
          <p className="text-muted-foreground">
            Manage and resolve duplicate student registrations across chapters
          </p>
        </div>
      </div>

      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400">About Duplicate Management</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                This page shows potential duplicate registrations based on student names within the same chapter.
                You can delete duplicate registrations, and the system will automatically notify the coordinator.
                Carefully review each case before taking action, as deletion cannot be undone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminDuplicateManagement />
    </div>
  )
}
