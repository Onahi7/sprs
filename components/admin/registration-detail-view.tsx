"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  User, Mail, Phone, MapPin, School, Building, Calendar, 
  CreditCard, FileText, Download, Edit, X, Eye
} from "lucide-react"
import { formatDate } from "@/lib/utils"

type RegistrationDetails = {
  id: number
  registrationNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  chapterId: number
  chapterName: string
  schoolId: number | null
  schoolName: string
  centerId: number | null
  centerName: string | null
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  parentConsent: boolean
  passportUrl: string
  paymentStatus: "pending" | "completed"
  paymentReference: string | null
  splitCodeUsed: string | null
  registrationType: "public" | "coordinator"
  coordinatorRegisteredBy: number | null
  coordinatorName: string | null
  registrationSlipDownloaded: boolean
  registrationSlipDownloadCount: number
  createdAt: string
}

interface RegistrationDetailViewProps {
  registrationId: number | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (registration: RegistrationDetails) => void
}

export function RegistrationDetailView({ 
  registrationId, 
  isOpen, 
  onClose, 
  onEdit 
}: RegistrationDetailViewProps) {
  const { toast } = useToast()
  const [registration, setRegistration] = useState<RegistrationDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && registrationId) {
      fetchRegistrationDetails()
    }
  }, [isOpen, registrationId])

  async function fetchRegistrationDetails() {
    if (!registrationId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/details`)
      if (!response.ok) throw new Error("Failed to fetch registration details")
      
      const data = await response.json()
      setRegistration(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load registration details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function downloadRegistrationSlip() {
    if (!registration) return
    
    try {
      const response = await fetch(`/api/admin/registrations/${registration.id}/slip`)
      if (!response.ok) throw new Error("Failed to download slip")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registration-slip-${registration.registrationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Registration slip downloaded successfully"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download registration slip",
        variant: "destructive"
      })
    }
  }

  if (!isOpen || !registrationId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Registration Details
          </DialogTitle>
          <DialogDescription>
            Complete information for registration {registration?.registrationNumber}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : registration ? (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Badge 
                  variant={registration.paymentStatus === "completed" ? "default" : "secondary"}
                  className="text-sm"
                >
                  {registration.paymentStatus === "completed" ? "Payment Completed" : "Payment Pending"}
                </Badge>
                <Badge 
                  variant={registration.registrationType === "coordinator" ? "secondary" : "outline"}
                  className="text-sm"
                >
                  {registration.registrationType === "coordinator" ? "Coordinator Registration" : "Public Registration"}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="outline" onClick={() => onEdit(registration)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                {registration.paymentStatus === "completed" && (
                  <Button variant="outline" onClick={downloadRegistrationSlip}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Slip
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg font-semibold">
                      {registration.firstName} {registration.middleName} {registration.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                    <p className="font-mono text-lg">{registration.registrationNumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p>{formatDate(registration.createdAt)}</p>
                  </div>

                  {registration.passportUrl && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Passport Photo</label>
                      <div className="mt-2">
                        <img 
                          src={registration.passportUrl} 
                          alt="Student passport" 
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Parent/Guardian Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Parent/Guardian Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg">{registration.parentFirstName} {registration.parentLastName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <p>{registration.parentPhone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p>{registration.parentEmail}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Consent Status</label>
                    <p>
                      <Badge variant={registration.parentConsent ? "default" : "destructive"}>
                        {registration.parentConsent ? "Consent Given" : "Consent Pending"}
                      </Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Chapter</label>
                      <p className="font-medium">{registration.chapterName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">School</label>
                      <p>{registration.schoolName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Examination Center</label>
                      <p>{registration.centerName || "Not assigned"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                    <p>
                      <Badge variant={registration.paymentStatus === "completed" ? "default" : "secondary"}>
                        {registration.paymentStatus === "completed" ? "Completed" : "Pending"}
                      </Badge>
                    </p>
                  </div>
                  
                  {registration.paymentReference && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Reference</label>
                      <p className="font-mono text-sm">{registration.paymentReference}</p>
                    </div>
                  )}
                  
                  {registration.splitCodeUsed && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Split Code Used</label>
                      <p>
                        <Badge variant="outline">{registration.splitCodeUsed}</Badge>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Registration Slip Information */}
            {registration.paymentStatus === "completed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Registration Slip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Downloaded {registration.registrationSlipDownloadCount} time(s)
                      </p>
                      {registration.registrationSlipDownloaded && (
                        <p className="text-sm text-green-600">
                          ✓ Registration slip has been downloaded
                        </p>
                      )}
                    </div>
                    <Button onClick={downloadRegistrationSlip}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Slip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coordinator Information (if applicable) */}
            {registration.registrationType === "coordinator" && registration.coordinatorName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Coordinator Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registered By</label>
                    <p className="font-medium">{registration.coordinatorName}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Registration not found
          </div>
        )}
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
