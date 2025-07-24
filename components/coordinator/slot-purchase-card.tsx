"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { CreditCard, Check, Star, Zap } from "lucide-react"
import { RefundDisclaimer } from "@/components/shared/refund-disclaimer"

interface SlotPackage {
  id: number
  name: string
  slotCount: number
  price: string
  description?: string
  splitCode?: string
}

interface SlotPurchaseCardProps {
  package: SlotPackage
  isPopular?: boolean
  onPurchase?: (packageId: number, paymentData: any) => void
  disabled?: boolean
}

export function SlotPurchaseCard({ 
  package: pkg, 
  isPopular = false, 
  onPurchase,
  disabled = false 
}: SlotPurchaseCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const { toast } = useToast()
  // Calculate per-slot price
  const pricePerSlot = (parseFloat(pkg.price) / pkg.slotCount).toFixed(2)

  const handlePurchaseClick = () => {
    if (disabled) {
      toast({
        title: "Purchase Unavailable",
        description: "This package is currently unavailable.",
        variant: "destructive"
      })
      return
    }
    
    if (!pkg.splitCode) {
      toast({
        title: "Configuration Error",
        description: "Payment configuration not found for this package.",
        variant: "destructive"
      })
      return
    }

    setShowConfirm(true)
  }
  const handleConfirmPurchase = async () => {
    setPurchasing(true)
    
    try {
      // Close confirmation dialog first
      setShowConfirm(false)

      // Call parent handler to initiate payment
      if (onPurchase) {
        await onPurchase(pkg.id, {
          slotPackageId: pkg.id,
          packageName: pkg.name,
          slotCount: pkg.slotCount,
          price: pkg.price
        })
      }

    } catch (error) {
      console.error('Purchase error:', error)
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to initiate purchase",
        variant: "destructive"
      })
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <>      <Card className={`relative ${isPopular ? 'border-blue-200 shadow-lg' : ''} ${disabled ? 'opacity-60' : ''}`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              <Star className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">{pkg.name}</CardTitle>
          <CardDescription>{pkg.description}</CardDescription>
          
          <div className="mt-4">
            <div className="text-3xl font-bold">
              ₦{parseFloat(pkg.price).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              ₦{pricePerSlot} per slot
            </div>
          </div>
        </CardHeader>        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">
              {pkg.slotCount} Slots
            </div>
            <p className="text-sm text-muted-foreground">
              Register up to {pkg.slotCount} students
            </p>
            {/* Show savings for larger packages */}
            {pkg.slotCount >= 100 && (
              <div className="mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {pkg.slotCount === 100 ? "5% savings" : pkg.slotCount === 200 ? "10% savings" : "Best value"}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Instant slot activation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Bulk student registration</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Registration slip download</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Usage tracking & analytics</span>
            </div>
            {/* Special features for larger packages */}
            {pkg.slotCount >= 200 && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Priority support</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handlePurchaseClick}
            disabled={disabled || !pkg.splitCode}
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Purchase Slots
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Confirm Slot Purchase
            </DialogTitle>
            <DialogDescription>
              Please review your purchase details before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Package</p>
                <p className="text-sm text-muted-foreground">{pkg.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Slots</p>
                <p className="text-sm text-muted-foreground">{pkg.slotCount} slots</p>
              </div>
              <div>
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm text-muted-foreground">₦{parseFloat(pkg.price).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Per Slot</p>
                <p className="text-sm text-muted-foreground">₦{pricePerSlot}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• You'll be redirected to secure payment gateway</li>
                <li>• Slots will be added immediately after payment</li>
                <li>• You can start registering students right away</li>
              </ul>
            </div>

            {/* Refund Disclaimer */}
            <RefundDisclaimer variant="compact" showDocumentLink={true} />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
              disabled={purchasing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmPurchase}
              disabled={purchasing}
            >
              {purchasing ? "Initiating..." : "Proceed to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
