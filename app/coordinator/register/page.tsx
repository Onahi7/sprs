import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoordinatorStudentRegistrationForm } from "@/components/coordinator/student-registration-form"
import { SlotBalanceDisplayAuto } from "@/components/coordinator/slot-balance-display-auto"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users, CheckCircle } from "lucide-react"

export default async function CoordinatorRegisterPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold gradient-text flex items-center justify-center gap-2">
              <Users className="h-8 w-8" />
              Student Registration
            </h1>
            <p className="text-muted-foreground">
              Register students using your slot balance
            </p>
          </div>

          {/* Slot Balance Display */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <SlotBalanceDisplayAuto />
            </div>
          </div>

          {/* Important Information */}
          <Alert className="border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Registration Process:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Each registration uses exactly 1 slot from your balance</li>
                <li>• Slot is deducted immediately upon successful registration</li>
                <li>• Registration slip can be downloaded immediately</li>
                <li>• No payment is required - your slot purchase covers the cost</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>
                Fill in the student's details below. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoordinatorStudentRegistrationForm />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
