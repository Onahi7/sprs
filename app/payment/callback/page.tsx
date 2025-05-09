"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!reference) {
      setLoading(false)
      setError("No payment reference provided")
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?reference=${reference}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setSuccess(true)
          setRegistrationNumber(data.data?.registrationNumber)
        } else {
          setError(data.error || "Payment verification failed")
        }
      } catch (error) {
        setError("An error occurred while verifying payment")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [reference])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying Payment</CardTitle>
            <CardDescription>Please wait while we verify your payment...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <p className="text-center text-muted-foreground">This may take a few moments</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{success ? "Payment Successful" : "Payment Failed"}</CardTitle>
          <CardDescription>
            {success ? "Your payment has been successfully processed" : "There was an issue with your payment"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {success ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center mb-6">Thank you for your payment. Your registration is now complete.</p>
              <div className="flex flex-col w-full gap-4">
                <Button asChild>
                  <Link href={`/status?registrationNumber=${registrationNumber}`}>View Registration Slip</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center text-red-500 mb-2">{error}</p>
              <p className="text-center mb-6">Please try again or contact support if the problem persists.</p>
              <div className="flex flex-col w-full gap-4">
                <Button asChild>
                  <Link href="/register">Try Again</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
