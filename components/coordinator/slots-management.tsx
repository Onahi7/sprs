"use client"

import { useState, useEffect } from "react"
import { SlotBalanceDisplay } from "./slot-balance-display"
import { SlotPurchaseCard } from "./slot-purchase-card"
import { SlotAnalyticsDashboard } from "./slot-analytics-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { 
  AlertCircle, 
  Zap, 
  History, 
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Search,
  Eye
} from "lucide-react"

interface SlotData {
  availableSlots: number
  usedSlots: number
  totalPurchasedSlots: number
  lastPurchaseDate?: Date
  lastUsageDate?: Date
}

interface SlotPackage {
  id: number
  name: string
  slotCount: number
  price: string
  description?: string
  splitCode?: string
}

interface PurchaseHistory {
  id: number
  reference: string
  slotsPurchased: number
  amountPaid: string
  paymentStatus: string
  purchaseDate: Date
  packageName: string
  transactionId?: string
}

export function SlotsManagement() {
  const [loading, setLoading] = useState(true)
  const [slots, setSlots] = useState<SlotData | null>(null)
  const [packages, setPackages] = useState<SlotPackage[]>([])
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [queryingPayment, setQueryingPayment] = useState<string | null>(null)
  const { toast } = useToast()
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const [slotsResponse, historyResponse] = await Promise.all([
        fetch('/api/coordinator/slots'),
        fetch('/api/coordinator/slots/history')
      ])
      
      if (!slotsResponse.ok) {
        throw new Error('Failed to fetch slot data')
      }
      
      const slotsData = await slotsResponse.json()
      setSlots(slotsData.slots)
      setPackages(slotsData.packages)
      
      // Fetch history if available
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setPurchaseHistory(historyData.history || [])
      }
      
    } catch (error) {
      console.error('Error fetching slot data:', error)
      toast({
        title: "Error",
        description: "Failed to load slot information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData(false)
  }  
  const handlePurchase = async (packageId: number, paymentData: any) => {
    try {
      console.log('Initializing payment for package:', packageId)
      
      // Initialize Paystack payment
      const response = await fetch('/api/coordinator/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotPackageId: packageId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      if (data.payment?.authorization_url) {
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to complete your payment securely.",
        })
        
        // Small delay to show the toast before redirect
        setTimeout(() => {
          window.location.href = data.payment.authorization_url
        }, 1000)
      } else {
        throw new Error('Payment URL not received')
      }
      
    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Purchase Failed", 
        description: error instanceof Error ? error.message : "An error occurred during purchase",
        variant: "destructive"
      })
    }
  }
  const queryPaymentStatus = async (reference: string) => {
    try {
      setQueryingPayment(reference)
      
      const response = await fetch('/api/coordinator/payment/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference })
      })

      const data = await response.json()

      if (data.success) {
        // If status was updated, refresh the UI
        if (data.status_updated) {
          toast({
            title: "Payment Verified Successfully!",
            description: `Status updated from pending to completed. ${data.slots_added ? `Added ${purchaseHistory.find(p => p.reference === reference)?.slotsPurchased || 0} slots to your balance.` : ''}`,
            variant: "default"
          })
          
          // Refresh data to show updated status and slot balance
          await fetchData(false)
        } else {
          // Just show information toast
          toast({
            title: "Payment Status Retrieved",
            description: `Status: ${data.paystack_data.status} | Gateway: ${data.paystack_data.gateway_response}`,
            variant: data.verification_result === 'PAYMENT_SUCCESSFUL' ? 'default' : 'destructive'
          })
        }
        
        // Show detailed payment info in console for debugging
        console.log('💳 Paystack Payment Details:', data.paystack_data)
      } else {
        toast({
          title: "Query Failed",
          description: data.error || "Failed to query payment from Paystack",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error querying payment:', error)
      toast({
        title: "Query Error",
        description: "Failed to query payment status",
        variant: "destructive"
      })
    } finally {
      setQueryingPayment(null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const isLowBalance = slots && slots.availableSlots <= 5
  const isOutOfSlots = slots && slots.availableSlots === 0

  return (
    <div className="space-y-6">
      {/* Slot Balance Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Current Balance</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <SlotBalanceDisplay slots={slots ?? undefined} loading={loading} />
        
        {/* Low Balance Alert */}
        {isOutOfSlots && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle className="text-red-700">No Slots Available</AlertTitle>
            <AlertDescription className="text-red-600">
              You need to purchase slots before you can register students. Choose a package below to get started.
            </AlertDescription>
          </Alert>
        )}
        
        {isLowBalance && !isOutOfSlots && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="text-yellow-700">Low Slot Balance</AlertTitle>
            <AlertDescription className="text-yellow-600">
              You have {slots?.availableSlots} slots remaining. Consider purchasing more slots to continue registering students without interruption.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="purchase" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Purchase Slots
          </TabsTrigger>          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Purchase History
            {purchaseHistory.filter(p => p.paymentStatus === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {purchaseHistory.filter(p => p.paymentStatus === 'pending').length} pending
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Available Packages</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose a slot package that fits your registration needs. Larger packages offer better value per slot.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-24 mt-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>          ) : packages.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, index) => (
                <SlotPurchaseCard
                  key={pkg.id}
                  package={pkg}
                  isPopular={pkg.slotCount === 100} // Mark 100-slot package as popular
                  onPurchase={handlePurchase}
                  disabled={!pkg.splitCode}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Packages Available</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Slot packages are not configured for your chapter yet. 
                  Please contact support for assistance.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Important Notes */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 space-y-2">
              <p className="text-sm">
                • Slots are added immediately after successful payment
              </p>
              <p className="text-sm">
                • Each student registration uses exactly 1 slot
              </p>
              <p className="text-sm">
                • Unused slots never expire and carry over indefinitely
              </p>
              <p className="text-sm">
                • You can track your usage and purchase history in the other tabs
              </p>
            </CardContent>
          </Card>        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Purchase History
                  </CardTitle>
                  <CardDescription>
                    Track your slot purchases and payment status
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {purchaseHistory.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'failed').length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const pendingTxns = purchaseHistory.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'failed')
                        for (const txn of pendingTxns) {
                          await queryPaymentStatus(txn.reference)
                          // Small delay between queries to avoid rate limiting
                          await new Promise(resolve => setTimeout(resolve, 1000))
                        }
                        // Refresh data after queries
                        await fetchData(false)
                      }}
                      disabled={queryingPayment !== null}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Query All Pending ({purchaseHistory.filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'failed').length})
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('/coordinator/slots/payment/status', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Detailed History
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>              ) : purchaseHistory.length > 0 ? (
                <div className="space-y-3">
                  {purchaseHistory.slice(0, 5).map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{purchase.packageName}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.slotsPurchased} slots • {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ref: {purchase.reference}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold">₦{parseFloat(purchase.amountPaid).toLocaleString()}</p>
                          <Badge 
                            variant={purchase.paymentStatus === 'completed' ? 'default' : 
                                   purchase.paymentStatus === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {purchase.paymentStatus}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => queryPaymentStatus(purchase.reference)}
                          disabled={queryingPayment === purchase.reference}
                          className="ml-2"
                        >
                          {queryingPayment === purchase.reference ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          {queryingPayment === purchase.reference ? 'Querying...' : 'Query'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {purchaseHistory.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open('/coordinator/slots/payment/status', '_blank')}
                      >
                        View All Purchases ({purchaseHistory.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Purchase History</h3>
                  <p className="text-sm text-muted-foreground">
                    Your slot purchases will appear here after you make your first purchase.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="analytics">
          <SlotAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
