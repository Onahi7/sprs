"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { FileDown } from "lucide-react"

type RegistrationSlipProps = {
  registration: any
}

export function RegistrationSlip({ registration }: RegistrationSlipProps) {
  const handleDownloadPDF = () => {
    window.open(`/api/registrations/${registration.registrationNumber}/slip`, "_blank")
  }

  return (
    <Card className="border-2 border-gray-300 print:shadow-none">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 border-b text-center py-4 flex flex-col items-center justify-between print:flex-row">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold">SPRS</span>
          </div>
          <h2 className="text-xl font-bold mt-2">Student Project Registration Slip</h2>
          <p className="text-sm text-muted-foreground">
            Registration Number: <span className="font-semibold">{registration.registrationNumber}</span>
          </p>
        </div>
        <Button onClick={handleDownloadPDF} className="mt-4 print:hidden">
          <FileDown className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">
                    {registration.firstName} {registration.middleName ? registration.middleName + " " : ""}
                    {registration.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chapter</p>
                  <p className="font-medium">{registration.chapter?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-medium">{registration.schoolName || registration.school?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exam Center</p>
                  <p className="font-medium">{registration.center?.name || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-2 gap-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {registration.parentFirstName} {registration.parentLastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{registration.parentPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{registration.parentEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{formatDate(registration.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-32 flex flex-col items-center">
            <div className="border border-gray-300 rounded-md overflow-hidden w-32 h-40">
              <Image
                src={registration.passportUrl || "/placeholder.svg"}
                alt="Passport photograph"
                width={128}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <p className="font-semibold text-green-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Please bring this registration slip and a valid ID to the exam center on the day of the project.
            </p>
            <p className="text-xs text-muted-foreground">This slip serves as proof of registration. Keep it safe.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
