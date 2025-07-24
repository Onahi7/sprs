"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  RefreshCw,
  Receipt,
  AlertTriangle
} from "lucide-react"
import { PaymentErrorHandler } from "@/components/coordinator/payment-error-handler"
import { RefundDisclaimer } from "@/components/shared/refund-disclaimer"

interface PaymentResult {
  success: boolean
  status: 'success' | 'failed' | 'pending' | 'abandoned'
  message: string
  reference?: string
  amount?: number
  slotsPurchased?: number
  transactionDate?: string
  customerEmail?: string
  packageName?: string
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackSkeleton />}>
      <PaymentCallbackContent />
    </Suspense>
  )
}

function PaymentCallbackSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PaymentCallbackContent() {
  const [verifying, setVerifying] = useState(true)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const reference = searchParams.get('reference')
  const trxref = searchParams.get('trxref')
  
  const paymentRef = reference || trxref

  const verifyPayment = async (ref: string, retry = false) => {
    try {
      setVerifying(true)
      
      const response = await fetch('/api/coordinator/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: ref })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setResult(data)

      // Show success toast for successful payments
      if (data.success && data.status === 'success') {
        toast({
          title: "Payment Successful!",
          description: `${data.slotsPurchased || 0} slots have been added to your account.`,
        })
        
        // Auto-redirect after 3 seconds for successful payments
        setTimeout(() => {
          router.push('/coordinator/slots')
        }, 3000)
        
        // Start countdown
        setRedirectCountdown(3)
        const countdownInterval = setInterval(() => {
          setRedirectCountdown(prev => {
            if (prev && prev > 1) {
              return prev - 1
            } else {
              clearInterval(countdownInterval)
              return null
            }
          })
        }, 1000)
      }

    } catch (error) {
      console.error('Payment verification error:', error)
      
      // If this is a retry and we're still getting errors, show failure
      if (retry) {
        setResult({
          success: false,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Payment verification failed'
        })
      } else {
        // First attempt failed, we'll retry automatically
        setRetryCount(prev => prev + 1)
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleRetry = () => {
    if (paymentRef) {
      setRetryCount(prev => prev + 1)
      verifyPayment(paymentRef, true)
    }
  }

  const handleGoBack = () => {
    router.push('/coordinator/slots')
  }

  useEffect(() => {
    if (!paymentRef) {
      setResult({
        success: false,
        status: 'failed',
        message: 'No payment reference found in URL'
      })
      setVerifying(false)
      return
    }

    // Initial verification
    verifyPayment(paymentRef)
  }, [paymentRef])

  // Auto-retry logic for pending payments
  useEffect(() => {
    if (result?.status === 'pending' && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        if (paymentRef) {
          verifyPayment(paymentRef)
        }
      }, 3000) // Retry after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [result, retryCount, paymentRef])

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
                {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500" />
              </div>
              <CardTitle>Unable to Verify Payment</CardTitle>
              <CardDescription>
                We couldn't verify your payment status. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex gap-4 justify-center">
                <Button onClick={handleRetry} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Verification
                </Button>
                <Button onClick={handleGoBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Slots
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (result.status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'failed':
      case 'abandoned':
        return <XCircle className="w-16 h-16 text-red-500" />
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />
      default:
        return <AlertTriangle className="w-16 h-16 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (result.status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'failed':
      case 'abandoned':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = () => {
    switch (result.status) {
      case 'success':
        return <Badge className="bg-green-600 text-white">Payment Successful</Badge>
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>
      case 'abandoned':
        return <Badge variant="destructive">Payment Abandoned</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Payment Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown Status</Badge>
    }
  }
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Use error handler for failed/abandoned payments */}
        {(result.status === 'failed' || result.status === 'abandoned') ? (
          <PaymentErrorHandler
            error={result.message}
            reference={paymentRef || undefined}
            onRetry={handleRetry}
            onGoBack={handleGoBack}
          />
        ) : (
          <Card className={getStatusColor()}>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                {getStatusIcon()}
              </div>
              <div className="flex justify-center mb-2">
                {getStatusBadge()}
              </div>
              <CardTitle className="text-2xl">
                {result.status === 'success' ? 'Payment Successful!' : 
                 result.status === 'pending' ? 'Payment Pending' :
                 'Payment Unsuccessful'}
              </CardTitle>
              <CardDescription className="text-base">
                {result.message}
                {result.status === 'success' && redirectCountdown && (
                  <div className="mt-2 text-sm text-green-600">
                    Redirecting to your slots in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
                  </div>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Payment Details */}
              {result.status === 'success' && (
                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium">Payment Details</h3>
                  </div>
                  
                  <div className="grid gap-2 text-sm">
                    {result.packageName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package:</span>
                        <span className="font-medium">{result.packageName}</span>
                      </div>
                    )}
                    {result.slotsPurchased && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Slots Purchased:</span>
                        <span className="font-medium">{result.slotsPurchased} slots</span>
                      </div>
                    )}
                    {result.amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-medium">₦{(result.amount / 100).toLocaleString()}</span>
                      </div>
                    )}
                    {result.reference && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-mono text-xs">{result.reference}</span>
                      </div>
                    )}
                    {result.transactionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(result.transactionDate).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Refund Policy Reminder for Successful Payments */}
              {result.status === 'success' && (
                <RefundDisclaimer variant="compact" showDocumentLink={false} />
              )}

              {/* Pending Payment Message */}
              {result.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your payment is being processed. This usually takes a few moments. 
                    We'll automatically check the status again in a few seconds.
                  </p>
                  {retryCount > 0 && (
                    <p className="text-xs text-yellow-700 mt-2">
                      Checking... (Attempt {retryCount + 1}/3)
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleGoBack} 
                  className={result.status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {result.status === 'success' ? 'View My Slots' : 'Back to Slots'}
                </Button>
                
                {result.status === 'pending' && (
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Status
                  </Button>
                )}
              </div>            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
