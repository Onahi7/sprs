"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import Link from "next/link"

export function RegistrationClosedBanner() {
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState<boolean | null>(null)
  const [isPaymentEnabled, setIsPaymentEnabled] = useState<boolean | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings/status')
        if (response.ok) {
          const data = await response.json()
          setIsRegistrationEnabled(data.registrationEnabled)
          setIsPaymentEnabled(data.paymentEnabled)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    
    fetchSettings()
    
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('registrationClosedBannerDismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])
  
  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('registrationClosedBannerDismissed', 'true')
  }
  
  if (isDismissed || isRegistrationEnabled === null || isRegistrationEnabled === true) {
    return null
  }
  
  return (
    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <div className="flex-1">
        <AlertTitle className="text-red-600 dark:text-red-400">Registration Period Ended</AlertTitle>
        <AlertDescription className="text-red-600 dark:text-red-400">
          <p>
            Student registrations are now closed. You can still access your existing registrations 
            and other coordinator features.
          </p>
          {!isPaymentEnabled && (
            <p className="mt-1">
              Slot purchases have also been disabled.
            </p>
          )}
          <div className="mt-2">
            <Link href="/coordinator/registrations">
              <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30">
                View My Registrations
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={handleDismiss}
        className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}
