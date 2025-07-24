"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, FileText } from "lucide-react"
import Link from "next/link"

interface RefundDisclaimerProps {
  variant?: "card" | "alert" | "compact"
  className?: string
  showDocumentLink?: boolean
}

export function RefundDisclaimer({ 
  variant = "alert", 
  className = "",
  showDocumentLink = true 
}: RefundDisclaimerProps) {
  const content = (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="font-semibold text-red-800">
            NO REFUND POLICY
          </p>
          <p className="text-sm text-red-700">
            All payments are <strong>FINAL and NON-REFUNDABLE</strong>. 
            By proceeding with payment, you acknowledge and accept that no refunds 
            will be provided under any circumstances, including system errors, 
            duplicate payments, or change of mind.
          </p>
          {showDocumentLink && (
            <div className="pt-2">
              <Link 
                href="/docs/refund-policy" 
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 hover:underline"
              >
                <FileText className="w-3 h-3" />
                Read Full Refund Policy
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (variant === "card") {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          {content}
        </CardContent>
      </Card>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`text-xs text-red-600 border-l-4 border-red-400 pl-3 py-2 bg-red-50 ${className}`}>
        <div className="flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong>NO REFUND:</strong> All payments are final and non-refundable.
            {showDocumentLink && (
              <Link href="/docs/refund-policy" className="ml-1 underline hover:no-underline">
                Policy
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default: alert variant
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertDescription>
        {content}
      </AlertDescription>
    </Alert>
  )
}
