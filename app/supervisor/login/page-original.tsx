"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Phone, Lock, UserCheck } from "lucide-react"

export default function SupervisorLoginPage() {
  console.log('SupervisorLoginPage component rendered')
  const router = useRouter()
  const { toast } = useToast()
  console.log('useToast hook initialized:', !!toast)
  
  const [step, setStep] = useState<'phone' | 'pin' | 'setup'>('phone')
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [supervisorData, setSupervisorData] = useState<any>(null)

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with phone:', phoneNumber)
    
    if (!phoneNumber.trim()) {
      console.log('Phone number is empty')
      toast({
        title: "Error",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    console.log('Setting loading to true')
    setLoading(true)
    try {
      console.log('About to make fetch request to /api/supervisor/auth')
      const response = await fetch('/api/supervisor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      })
      console.log('Fetch request completed')

      const data = await response.json()
      console.log('Phone submit response:', response)
      console.log('Phone submit data:', data)

      if (response.ok) {
        setSupervisorData(data.supervisor)
        if (data.setupRequired) {
          setStep('setup')
        } else {
          setStep('pin')
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to verify phone number",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Phone submit error:', error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      toast({
        title: "Error",
        description: "Please enter your PIN",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/supervisor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          pin, 
          action: 'login' 
        })
      })

      const data = await response.json()
      console.log('PIN login response:', response)
      console.log('PIN login data:', data)

      if (response.ok) {
        // Store session token
        localStorage.setItem('supervisor_token', data.sessionToken)
        localStorage.setItem('supervisor_data', JSON.stringify(data.supervisor))
        
        toast({
          title: "Success",
          description: "Login successful",
        })
        
        router.push('/supervisor')
      } else {
        toast({
          title: "Error",
          description: data.error || "Invalid PIN",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('PIN login error:', error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePinSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim() || !confirmPin.trim()) {
      toast({
        title: "Error",
        description: "Please enter and confirm your PIN",
        variant: "destructive",
      })
      return
    }

    if (pin !== confirmPin) {
      toast({
        title: "Error",
        description: "PINs do not match",
        variant: "destructive",
      })
      return
    }

    if (pin.length < 4 || pin.length > 6) {
      toast({
        title: "Error",
        description: "PIN must be 4-6 digits",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/supervisor/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber, 
          pin, 
          action: 'setup' 
        })
      })

      const data = await response.json()
      console.log('PIN setup response:', response)
      console.log('PIN setup data:', data)

      if (response.ok) {
        // Store session token
        localStorage.setItem('supervisor_token', data.sessionToken)
        localStorage.setItem('supervisor_data', JSON.stringify(data.supervisor))
        
        toast({
          title: "Success",
          description: "PIN setup successful! You are now logged in.",
        })
        
        router.push('/supervisor')
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to setup PIN",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('PIN setup error:', error)
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('phone')
    setPhoneNumber('')
    setPin('')
    setConfirmPin('')
    setSupervisorData(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Supervisor Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            NAPPS Nasarawa State Exam Attendance System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'phone' && 'Enter Phone Number'}
              {step === 'pin' && 'Enter PIN'}
              {step === 'setup' && 'Setup PIN'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' && 'Enter your registered phone number to continue'}
              {step === 'pin' && `Welcome back, ${supervisorData?.name}! Enter your PIN to login`}
              {step === 'setup' && `Hello ${supervisorData?.name}! Set up your 4-6 digit PIN for future logins`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="08012345678"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </form>
            )}

            {step === 'pin' && (
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter your PIN"
                      className="pl-10"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                  </Button>
                </div>
              </form>
            )}

            {step === 'setup' && (
              <form onSubmit={handlePinSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-pin">Create PIN (4-6 digits)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="new-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Create your PIN"
                      className="pl-10"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-pin"
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Confirm your PIN"
                      className="pl-10"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Setup PIN
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {supervisorData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Supervisor Information
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>Name: {supervisorData.name}</p>
                  <p>Phone: {supervisorData.phoneNumber}</p>
                  {supervisorData.schoolName && <p>School: {supervisorData.schoolName}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
