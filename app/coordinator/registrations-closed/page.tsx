import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CalendarClock, ChevronLeft, Home, List, User } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorRegistrationsClosedPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="bg-red-50 dark:bg-red-900/30 rounded-t-lg border-b border-red-100 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Registrations Closed</CardTitle>
            </div>
            <CardDescription className="text-red-600 dark:text-red-300">
              New student registrations are currently disabled
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p>
              The NAPPS Nasarawa State Unified Examination registration period has ended. You cannot 
              register new students at this time. However, you can still access other coordinator features.
            </p>

            <div className="my-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                <CalendarClock className="h-4 w-4" />
                <h3 className="font-medium">Important Information</h3>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-300">
                All previously registered students remain valid for the upcoming examination. 
                You can still view your registered students and access other coordinator features.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
              <Button asChild>
                <Link href="/coordinator">
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coordinator/registrations">
                  <List className="h-4 w-4 mr-2" />
                  View Registrations
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/coordinator/supervisors">
                  <User className="h-4 w-4 mr-2" />
                  Supervisors
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
