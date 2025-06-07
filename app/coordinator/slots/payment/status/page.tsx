"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  History,
  Receipt,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ArrowLeft,
  RefreshCw
} from "lucide-react"
import { useRouter } from "next/navigation"

interface PurchaseHistory {
  id: number
  reference: string
  slotsPurchased: number
  amountPaid: number
  paymentStatus: string
  purchaseDate: string
  packageName: string
  transactionId?: string
}

interface PaymentSummary {
  totalPurchases: number
  totalSlotsPurchased: number
  totalAmountSpent: number
  successfulPayments: number
  pendingPayments: number
  failedPayments: number
}

export default function PaymentStatusPage() {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<PurchaseHistory[]>([])
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/coordinator/slots/history')
      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }
      
      const data = await response.json()
      setHistory(data.history || [])
      setSummary(data.summary || null)
      
    } catch (error) {
      console.error('Error fetching payment history:', error)
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <Badge className="bg-green-600 text-white">Success</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pending</Badge>
      case 'abandoned':
        return <Badge variant="secondary">Abandoned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Receipt className="w-4 h-4 text-gray-500" />
    }
  }

  const handleDownloadReceipt = async (transactionId: string) => {
    try {
      // This would generate and download a receipt
      toast({
        title: "Feature Coming Soon",
        description: "Receipt download will be available soon",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download receipt",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/coordinator/slots')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Slots
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-muted-foreground">
              View your slot purchase history and payment status
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Transaction History
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Payment Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-4">
                {history.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(transaction.paymentStatus)}
                            <div>
                              <p className="font-medium">{transaction.packageName}</p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.slotsPurchased} slots purchased
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {new Date(transaction.purchaseDate).toLocaleDateString()} 
                              {' '}
                              {new Date(transaction.purchaseDate).toLocaleTimeString()}
                            </span>
                            <span className="font-mono">
                              Ref: {transaction.reference}
                            </span>
                          </div>
                        </div>

                        <div className="text-right space-y-2">
                          <div className="text-lg font-semibold">
                            ₦{transaction.amountPaid.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(transaction.paymentStatus)}
                            {transaction.paymentStatus.toLowerCase() === 'success' && 
                             transaction.transactionId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReceipt(transaction.transactionId!)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Receipt
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    You haven't made any slot purchases yet.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => router.push('/coordinator/slots')}
                  >
                    Purchase Slots
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : summary ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Purchases
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalPurchases}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Slots Purchased
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {summary.totalSlotsPurchased}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Amount Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{summary.totalAmountSpent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Successful Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {summary.successfulPayments}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {summary.pendingPayments}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Failed Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {summary.failedPayments}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Summary Available</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Payment summary will appear after your first purchase.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
