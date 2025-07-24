"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RefundDisclaimer } from "@/components/shared/refund-disclaimer"

type Chapter = {
  id: number
  name: string
  amount: string
}

type PaymentSummaryStepProps = {
  data: any
  onSubmit: () => void
  onPrevious: () => void
}

export function PaymentSummaryStep({ data, onSubmit, onPrevious }: PaymentSummaryStepProps) {
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChapterDetails = async () => {
      if (!data.chapterId) return

      try {
        const response = await fetch(`/api/chapters/${data.chapterId}`)
        if (!response.ok) throw new Error("Failed to fetch chapter details")
        const chapterData = await response.json()
        setChapter(chapterData)
      } catch (error) {
        console.error("Error fetching chapter details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChapterDetails()
  }, [data.chapterId])

  if (loading) {
    return <div className="text-center py-8">Loading payment details...</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Payment Summary</h3>
        <p className="text-sm text-muted-foreground">
          Please review your registration details before proceeding to payment
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">
                {data.firstName} {data.middleName ? data.middleName + " " : ""}
                {data.lastName}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Chapter:</span>
              <span className="font-medium">{chapter?.name || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">School:</span>
              <span className="font-medium">{data.schoolName || "School ID: " + data.schoolId}</span>
            </div>

            <Separator className="my-2" />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>₦{chapter?.amount || "3,000.00"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          By clicking "Proceed to Payment", you will be redirected to our secure payment gateway.
        </p>
      </div>

      {/* Refund Disclaimer */}
      <RefundDisclaimer variant="alert" showDocumentLink={true} />

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onSubmit}>Proceed to Payment</Button>
      </div>
    </div>
  )
}
