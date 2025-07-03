"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Search, FileText, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function VerifyPage() {
  const router = useRouter()
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registrationNumber.trim()) return

    setIsSearching(true)
    
    // Navigate to the specific verification page
    router.push(`/verify/${registrationNumber.trim()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 mr-4 rounded-full border-4 border-green-600 p-1 bg-white">
              <Image
                src="https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png"
                alt="NAPPS Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-logo.svg";
                }}
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                NAPPS NASARAWA STATE CHAPTER
              </h1>
              <p className="text-gray-600">Unified Certificate Examination Verification Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {/* Main Verification Card */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Result Verification Portal
            </CardTitle>
            <CardDescription className="text-lg">
              Enter your registration number to verify and view your examination results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerification} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber" className="text-lg font-medium">
                  Registration Number
                </Label>
                <Input
                  id="registrationNumber"
                  type="text"
                  placeholder="Enter your registration number (e.g., SPRS-2024-001-NAS-001)"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="text-lg p-4 h-14"
                  required
                />
                <p className="text-sm text-gray-600">
                  Your registration number can be found on your registration slip or confirmation email.
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-14 text-lg"
                disabled={isSearching || !registrationNumber.trim()}
              >
                <Search className="h-5 w-5 mr-2" />
                {isSearching ? 'Verifying...' : 'Verify Result'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Official Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                View your official NAPPS Nasarawa State Unified Certificate Examination results with complete subject breakdown.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Verified Authentic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                All results are digitally verified and authenticated by NAPPS Nasarawa State Chapter.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">
                Your results are protected with secure verification protocols and QR code authentication.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-green-600 mb-2">For Students:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Enter your complete registration number</li>
                  <li>• Click "Verify Result" to view your results</li>
                  <li>• Download or print your official result slip</li>
                  <li>• Check your center position and grades</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-600 mb-2">For Verification:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Results are instantly verified upon access</li>
                  <li>• QR codes on result slips link to this portal</li>
                  <li>• All data is authenticated by NAPPS officials</li>
                  <li>• Contact support for any verification issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8 border-t pt-6">
          <p className="font-medium">NAPPS Nasarawa State Chapter - Official Verification Portal</p>
          <p>For inquiries, contact the examination body</p>
          <p className="mt-2 text-xs">
            Domain: exams.nappsnasarawa.com • Powered by NAPPS Unified Examination System
          </p>
        </div>
      </div>
    </div>
  )
}
