"use client"

import { RegistrationSlip } from "@/components/registration/registration-slip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Sample registration data for demonstration
const sampleRegistration = {
  id: 1,
  registrationNumber: "SPRS-2025-NASARAWA-001",
  firstName: "Ahmed",
  middleName: "Ibrahim",
  lastName: "Usman",
  parentFirstName: "Ibrahim",
  parentLastName: "Usman",
  parentPhone: "+234 803 123 4567",
  parentEmail: "ibrahim.usman@email.com",
  schoolName: "Government Science College Nasarawa",
  passportUrl: "/placeholder-user.jpg",
  paymentStatus: "completed",
  paymentReference: "FLW-MOCK-12345678",
  createdAt: new Date().toISOString(),
  chapter: {
    id: 1,
    name: "Nasarawa Chapter"
  },
  school: {
    id: 1,
    name: "Government Science College Nasarawa"
  },
  center: {
    id: 1,
    name: "Nasarawa Central Exam Center"
  }
}

export default function RegistrationSlipDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Button>
            </Link>
            
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Registration Slip Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-800 dark:text-blue-200">
                <p className="mb-4">
                  This is a demonstration of how the registration slip appears to users after they complete their registration and payment.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Features:</h4>
                    <ul className="space-y-1">
                      <li>• Professional PDF generation</li>
                      <li>• Print-friendly layout</li>
                      <li>• Secure access via registration number</li>
                      <li>• Student and parent information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Access Points:</h4>
                    <ul className="space-y-1">
                      <li>• Status page (/status)</li>
                      <li>• Admin registration table</li>
                      <li>• Coordinator registration table</li>
                      <li>• Email confirmation link</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sample Registration Slip */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Sample Registration Slip</h2>
            <RegistrationSlip registration={sampleRegistration} />
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How Users Access Their Registration Slip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">For Students/Parents:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Visit the status page (/status)</li>
                    <li>Enter their registration number</li>
                    <li>View registration details</li>
                    <li>Print or download PDF slip</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">For Admins/Coordinators:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Access registration tables</li>
                    <li>Click "Print Slip" button</li>
                    <li>PDF opens in new tab</li>
                    <li>Can print or save directly</li>
                  </ol>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Important Notes:</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Registration slips are only available after payment completion</li>
                  <li>• Each slip contains a unique registration number</li>
                  <li>• Students must bring the slip and valid ID to exam centers</li>
                  <li>• PDF downloads are secured and tracked</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
