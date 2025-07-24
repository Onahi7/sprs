import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft, FileText, Shield } from "lucide-react"
import Link from "next/link"
import { RefundDisclaimer } from "@/components/shared/refund-disclaimer"

export default function TermsOfServicePage() {
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-muted-foreground">NAPPS Nasarawa Unified Exams (NNUE)</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Refund Policy Highlight */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                Important: Payment Policy
              </CardTitle>
              <CardDescription>
                Please review our refund policy before making any payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RefundDisclaimer variant="compact" showDocumentLink={true} />
              <div className="mt-4">
                <Link href="/docs/refund-policy">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Read Complete Refund Policy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Terms Content */}
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
              <CardDescription>
                By using the SPRS platform, you agree to these terms
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground">
                    By accessing and using the NAPPS Nasarawa Unified Exams (NNUE) system, 
                    you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">2. Use License</h3>
                  <p className="text-muted-foreground">
                    Permission is granted to temporarily download one copy of the materials on NNUE 
                    for personal, non-commercial transitory viewing only.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">3. Payment Terms</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-2">
                      <strong>NO REFUND POLICY:</strong>
                    </p>
                    <p className="text-red-700 text-sm">
                      All payments made through the NNUE platform are final and non-refundable. 
                      This includes registration fees, coordinator slot purchases, and all associated charges.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">4. User Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Provide accurate and complete information during registration</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">5. Limitations</h3>
                  <p className="text-muted-foreground">
                    In no event shall NNUE or its suppliers be liable for any damages arising 
                    out of the use or inability to use the materials on NNUE's website.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">6. Revisions</h3>
                  <p className="text-muted-foreground">
                    NNUE may revise these terms of service at any time without notice. 
                    By using this website, you are agreeing to be bound by the current version 
                    of these terms of service.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                For questions about these terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> nappsnasarawa@gmail.com</p>
                <p><strong>Address:</strong> NAPPS Nasarawa State Chapter</p>
                <p><strong>Last Updated:</strong> July 24, 2025</p>
              </div>
            </CardContent>
          </Card>
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
            <Link href="/docs/refund-policy">
              <FileText className="w-4 h-4 mr-2" />
              View Refund Policy
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
