"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentInitializePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationId = searchParams.get("registrationId")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!registrationId) {
      setLoading(false)
      setError("No registration ID provided")
      return
    }

    const initializePayment = async () => {
      try {
        const response = await fetch("/api/payment/initialize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ registrationId }),
        })

        const data = await response.json()
        console.log("Payment initialization response:", data)

        if (response.ok && data.success) {
          // Redirect to Paystack payment page
          console.log("Redirecting to payment page:", data.authorizationUrl)
          window.location.href = data.authorizationUrl
        } else {
          console.error("Payment initialization failed:", data.error)
          setError(data.error || "Failed to initialize payment")
          setLoading(false)
        }
      } catch (error) {
        setError("An error occurred while initializing payment")
        setLoading(false)
      }
    }

    initializePayment()
  }, [registrationId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Initializing Payment</CardTitle>
            <CardDescription>Please wait while we redirect you to the payment gateway...</CardDescription>
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
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>There was an issue initializing your payment</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-center text-red-500 mb-6">{error}</p>
          <div className="flex flex-col w-full gap-4">
            <Button asChild>
              <Link href="/status">Return to Registration Status</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
