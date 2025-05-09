"use client"

import React from "react"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Printer, Loader2, FileDown, ChevronLeft } from "lucide-react"
import { RegistrationSlip } from "@/components/registration/registration-slip"
import Link from "next/link"

export default function StatusPage() {
  const searchParams = useSearchParams()
  const initialRegNumber = searchParams.get("registrationNumber") || ""

  const [registrationNumber, setRegistrationNumber] = useState(initialRegNumber)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registration, setRegistration] = useState<any>(null)

  // If there's an initial registration number, fetch the registration
  React.useEffect(() => {
    if (initialRegNumber) {
      handleSearch(new Event("submit") as any)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRegNumber])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setRegistration(null)

    try {
      const response = await fetch(`/api/registrations?registrationNumber=${registrationNumber}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError("Registration not found. Please check your registration number and try again.")
        } else {
          throw new Error("Failed to fetch registration")
        }
        return
      }

      const data = await response.json()
      setRegistration(data)
    } catch (error) {
      setError("An error occurred while fetching your registration. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 gradient-text">Check Registration Status</h1>

          <Card className="mb-8 shadow-lg border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle>Registration Lookup</CardTitle>
              <CardDescription>Enter your registration number to check your status and print your slip</CardDescription>
            </CardHeader>
            <form onSubmit={handleSearch}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registration-number">Registration Number</Label>
                  <Input
                    id="registration-number"
                    placeholder="e.g., SPRS-23-1-00-0001"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {error && (
            <Alert variant="destructive" className="mb-8 animate-fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {registration && (
            <div className="space-y-6 animate-fade-in">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Registration Details</CardTitle>
                  <CardDescription>
                    Registration status:{" "}
                    <span
                      className={`font-semibold ${registration.paymentStatus === "completed" ? "text-green-500" : "text-amber-500"}`}
                    >
                      {registration.paymentStatus === "completed" ? "Completed" : "Pending Payment"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Number</p>
                      <p className="font-medium">{registration.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
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
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Date</p>
                      <p className="font-medium">{new Date(registration.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3">
                  {registration.paymentStatus === "completed" ? (
                    <>
                      <Button className="w-full sm:w-auto" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Registration Slip
                      </Button>
                      <Button variant="outline" className="w-full sm:w-auto" asChild>
                        <a
                          href={`/api/registrations/${registration.registrationNumber}/slip`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button className="w-full" variant="default" asChild>
                      <a href={`/payment/initialize?registrationId=${registration.id}`}>Complete Payment</a>
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {registration.paymentStatus === "completed" && (
                <div className="print-only">
                  <RegistrationSlip registration={registration} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
