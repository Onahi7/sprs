import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Calendar, ChevronLeft, Home } from "lucide-react"

export default function RegistrationsClosedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="bg-red-50 dark:bg-red-900/30 rounded-t-lg border-b border-red-100 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <CardTitle>Registrations Closed</CardTitle>
              </div>
              <CardDescription className="text-red-600 dark:text-red-300">
                Registration for the examination is currently closed
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p>
                We're sorry, but the registration period for the NAPPS Nasarawa State Unified Examination 
                has ended. Registrations are no longer being accepted at this time.
              </p>

              <div className="my-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-medium">Important Dates</h3>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  The examination is scheduled as planned. All previously registered candidates should 
                  prepare accordingly. Please contact your school or chapter coordinator for more information.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Button asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Return to Home
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/status">
                    Check Registration Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
