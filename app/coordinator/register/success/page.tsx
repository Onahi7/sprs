import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
// Force dynamic rendering to allow runtime use of searchParams
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Download, User, School, Users, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: {
    registration?: string
  }
}

export default async function RegistrationSuccessPage({ searchParams }: PageProps) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }

  const registrationNumber = searchParams.registration

  if (!registrationNumber) {
    redirect("/coordinator/register")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Registration Successful!
            </h1>
            <p className="text-lg text-muted-foreground">
              Student has been registered successfully using your slot balance
            </p>
          </div>

          {/* Registration Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Registration Details
              </CardTitle>
              <CardDescription>
                Please save these details for your records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                  <div className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded">
                    {registrationNumber}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                  <div className="text-lg font-semibold">
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>What happens next:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Registration confirmation email sent to parent/guardian</li>
                <li>• Student can now participate in the NAPPS competition</li>
                <li>• Registration slip can be downloaded below</li>
                <li>• 1 slot has been deducted from your balance</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="w-full">
              <Link href={`/api/registrations/${registrationNumber}/slip`}>
                <Download className="mr-2 h-4 w-4" />
                Download Registration Slip
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/coordinator/register">
                <User className="mr-2 h-4 w-4" />
                Register Another Student
              </Link>
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button variant="ghost" asChild>
              <Link href="/coordinator/register">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Registration
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link href="/coordinator/slots">
                <CreditCard className="mr-2 h-4 w-4" />
                View Slot Balance
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link href="/coordinator">
                <Users className="mr-2 h-4 w-4" />
                Coordinator Dashboard
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
