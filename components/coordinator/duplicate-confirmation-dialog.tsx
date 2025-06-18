"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, User, Calendar, School, CheckCircle2, Clock } from "lucide-react"

interface DuplicateRegistration {
  id: number
  registrationNumber: string
  firstName: string
  middleName?: string
  lastName: string
  schoolName?: string
  paymentStatus: string
  createdAt: string
  coordinatorRegisteredBy?: number
}

interface DuplicateConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  duplicates: DuplicateRegistration[]
  studentName: string
  loading?: boolean
}

export function DuplicateConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  duplicates,
  studentName,
  loading = false
}: DuplicateConfirmationDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Potential Duplicate Registration Detected
          </DialogTitle>
          <DialogDescription>
            We found {duplicates.length} existing registration(s) with similar name(s) to <strong>{studentName}</strong>. 
            Please review the details below before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Duplicate registrations can cause issues during examinations. 
              Please verify this is a different student before continuing.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              Existing Registrations Found:
            </h4>
            
            {duplicates.map((duplicate) => (
              <div 
                key={duplicate.id} 
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        {duplicate.firstName} {duplicate.middleName ? `${duplicate.middleName} ` : ''}{duplicate.lastName}
                      </span>
                      {getStatusIcon(duplicate.paymentStatus)}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <strong>Registration #:</strong> 
                        <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          {duplicate.registrationNumber}
                        </code>
                      </div>
                      
                      {duplicate.schoolName && (
                        <div className="flex items-center gap-2">
                          <School className="h-3 w-3" />
                          <span>{duplicate.schoolName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Registered: {formatDate(duplicate.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(duplicate.paymentStatus)}
                    {duplicate.coordinatorRegisteredBy && (
                      <Badge variant="outline" className="text-xs">
                        Coordinator Registration
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-300">
              <strong>Options:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>Cancel:</strong> Go back and verify the student details</li>
                <li>• <strong>Continue:</strong> Proceed if this is a different student with the same name</li>
                <li>• <strong>Contact Support:</strong> If you believe this is an error, please contact support</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel Registration
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
          >
            {loading ? "Processing..." : "Continue Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
