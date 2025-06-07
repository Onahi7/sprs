"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowLeft, 
  MessageSquare,
  HelpCircle,
  Mail,
  Phone
} from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentErrorHandlerProps {
  error: string
  reference?: string
  onRetry?: () => void
  onGoBack?: () => void
}

export function PaymentErrorHandler({ 
  error, 
  reference, 
  onRetry, 
  onGoBack 
}: PaymentErrorHandlerProps) {
  const [showSupport, setShowSupport] = useState(false)
  const [submittingSupport, setSubmittingSupport] = useState(false)
  const [supportData, setSupportData] = useState({
    name: '',
    email: '',
    phone: '',
    issue: error,
    additionalInfo: ''
  })
  const { toast } = useToast()
  const router = useRouter()

  const handleSupportSubmit = async () => {
    setSubmittingSupport(true)
    
    try {
      // In a real implementation, this would send the support request
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Support Request Sent",
        description: "Our team will contact you within 24 hours to resolve this issue.",
      })
      
      setShowSupport(false)
    } catch (error) {
      toast({
        title: "Failed to Send Request", 
        description: "Please try again or contact us directly.",
        variant: "destructive"
      })
    } finally {
      setSubmittingSupport(false)
    }
  }

  const commonIssues = [
    {
      title: "Network Connection Issues",
      description: "Check your internet connection and try again",
      solution: "Ensure you have a stable internet connection"
    },
    {
      title: "Payment Gateway Timeout",
      description: "The payment may have timed out during processing",
      solution: "Wait a few minutes and check your payment status"
    },
    {
      title: "Bank Declined Transaction",
      description: "Your bank may have declined the transaction",
      solution: "Contact your bank or try a different payment method"
    },
    {
      title: "Insufficient Funds",
      description: "Your account may not have sufficient balance",
      solution: "Check your account balance and try again"
    }
  ]

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-red-700">Payment Error</CardTitle>
          <CardDescription className="text-red-600">
            {error}
          </CardDescription>
          {reference && (
            <p className="text-sm text-red-500 font-mono mt-2">
              Reference: {reference}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Payment
              </Button>
            )}
            <Button 
              onClick={onGoBack || (() => router.push('/coordinator/slots'))}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Slots
            </Button>
          </div>

          {/* Common Issues */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Common Issues & Solutions
            </h3>
            
            <div className="space-y-3">
              {commonIssues.map((issue, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-800">{issue.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">{issue.solution}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3">Still Need Help?</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Email: support@napps.org.ng</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>Phone: +234 (0) 700 NAPPS HELP</span>
              </div>
            </div>

            <Button 
              onClick={() => setShowSupport(true)}
              variant="outline" 
              size="sm"
              className="mt-4 w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Dialog */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll help you resolve it quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={supportData.name}
                  onChange={(e) => setSupportData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={supportData.email}
                  onChange={(e) => setSupportData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={supportData.phone}
                onChange={(e) => setSupportData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Issue Description</Label>
              <Textarea
                id="issue"
                value={supportData.issue}
                onChange={(e) => setSupportData(prev => ({ ...prev, issue: e.target.value }))}
                placeholder="Describe the payment issue you encountered"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={supportData.additionalInfo}
                onChange={(e) => setSupportData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                placeholder="Any additional details that might help us resolve your issue"
                rows={2}
              />
            </div>

            {reference && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Payment Reference:</strong> <span className="font-mono">{reference}</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSupport(false)}
              disabled={submittingSupport}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSupportSubmit}
              disabled={submittingSupport || !supportData.name || !supportData.email}
            >
              {submittingSupport ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
