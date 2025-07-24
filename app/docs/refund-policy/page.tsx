import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, ArrowLeft, ShieldX } from "lucide-react"
import Link from "next/link"

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Refund Policy</h1>
              <p className="text-muted-foreground">NAPPS Nasarawa Unified Exams (NNUE)</p>
            </div>
          </div>
          
          <Badge variant="destructive" className="mb-4">
            Effective Immediately
          </Badge>
        </div>

        {/* Main Policy Card */}
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              NO REFUND POLICY
            </CardTitle>
            <CardDescription className="text-red-700 font-medium">
              All payments made through the NNUE platform are FINAL and NON-REFUNDABLE.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-red-700">
            <p className="text-sm">
              This policy applies to ALL payments including student registration fees, 
              coordinator slot purchases, and any additional charges or fees.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Policy Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* What This Covers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Policy Coverage</CardTitle>
                <CardDescription>This refund policy applies to:</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Student registration fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Coordinator slot purchases (50-slot and 100-slot packages)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Payment processing fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Any additional charges or fees</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Rationale */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Why This Policy Exists</CardTitle>
                <CardDescription>Understanding the reasons behind our no-refund policy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Administrative Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      Once payment is processed, administrative work begins immediately including 
                      registration data processing, document generation, and system resource allocation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Resource Allocation</h4>
                    <p className="text-sm text-muted-foreground">
                      Payments result in immediate resource allocation such as slot allocation for 
                      coordinators, registration slot reservation, and database storage allocation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Third-Party Costs</h4>
                    <p className="text-sm text-muted-foreground">
                      Payment processing involves non-refundable third-party costs including payment 
                      gateway fees, bank transaction charges, and system processing costs.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2">Operational Integrity</h4>
                    <p className="text-sm text-muted-foreground">
                      Refunds would compromise system financial integrity, fair allocation of 
                      limited resources, and operational efficiency.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* No Exceptions */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-800">No Exceptions Apply</CardTitle>
                <CardDescription className="text-orange-700">
                  This policy has absolutely no exceptions
                </CardDescription>
              </CardHeader>
              <CardContent className="text-orange-700">
                <p className="text-sm mb-3">
                  Refunds will <strong>NOT</strong> be granted under any circumstances including:
                </p>
                <ul className="space-y-1 text-sm">
                  <li>• Change of mind</li>
                  <li>• Duplicate payments</li>
                  <li>• System errors</li>
                  <li>• Technical difficulties</li>
                  <li>• Coordinator errors</li>
                  <li>• Student withdrawal</li>
                  <li>• Program cancellation</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Acknowledgment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Acknowledgment</CardTitle>
                <CardDescription>
                  By proceeding with payment, you explicitly acknowledge and agree:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>You have read and understood this refund policy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>You accept that all payments are final and non-refundable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>You understand no refunds will be provided under any circumstances</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>You accept full responsibility for your payment decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>You acknowledge that payment processing fees are non-recoverable</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Policy Status:</span>
                  <Badge variant="destructive">No Refunds</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exceptions:</span>
                  <span className="font-medium">None</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Effective:</span>
                  <span className="font-medium">Immediately</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Review:</span>
                  <span className="font-medium">Annual</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Questions About Policy</CardTitle>
                <CardDescription className="text-xs">
                  For questions only (NOT refund requests)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Technical Support</p>
                  <p className="text-muted-foreground">nappsnasarawa@gmail.com</p>
                </div>
                <div>
                  <p className="font-medium">Administrative Queries</p>
                  <p className="text-muted-foreground">nappsnasarawa@gmail.com</p>
                </div>
                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <strong>Note:</strong> Contacting support does not guarantee any exceptions to this policy.
                </p>
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span>1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>July 24, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Review:</span>
                  <span>July 2026</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/register">
              I Understand - Proceed to Registration
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
