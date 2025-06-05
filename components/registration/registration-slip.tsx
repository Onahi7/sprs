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
      <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b text-center py-6 flex flex-col items-center justify-between print:flex-row">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 mb-3">
            <Image
              src="https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png"
              alt="NAPPS Nasarawa Logo"
              width={80}
              height={80}
              className="object-contain w-full h-full"
              onError={(e) => {
                // Fallback to SVG logo if PNG fails
                const target = e.target as HTMLImageElement;
                target.src = "https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png";
              }}
            />
          </div>
          <h1 className="text-lg font-bold text-blue-800 dark:text-blue-200">
            NAPPS NASARAWA STATE
          </h1>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1">
            UNIFIED EXAMS REGISTRATION SLIP
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Registration Number: <span className="font-semibold text-blue-600">{registration.registrationNumber}</span>
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
              Please bring this registration slip and a valid ID to the exam center on the examination day.
            </p>
            <p className="text-xs text-muted-foreground">
              This slip serves as proof of registration for NAPPS Nasarawa Unified Exams. Keep it safe.
            </p>
            <div className="mt-3 text-xs text-blue-600">
              <p>National Association of Proprietors of Private Schools - Nasarawa State Chapter</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
