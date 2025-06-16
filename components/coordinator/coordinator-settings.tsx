"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Mail, Key, Shield, Building, Save, RefreshCw } from "lucide-react"

interface CoordinatorData {
  id: number
  name: string
  email: string
  uniqueCode: string
  chapterName: string
  chapterId: number
}

export function CoordinatorSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coordinator, setCoordinator] = useState<CoordinatorData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    fetchCoordinatorData()
  }, [])

  const fetchCoordinatorData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coordinator/profile')
      
      if (response.ok) {
        const data = await response.json()
        setCoordinator(data.coordinator)
        setFormData({
          name: data.coordinator.name,
          email: data.coordinator.email
        })
      } else {
        throw new Error('Failed to fetch coordinator data')
      }
    } catch (error) {
      console.error('Error fetching coordinator data:', error)
      toast({
        title: "Error",
        description: "Failed to load coordinator settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/coordinator/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings updated successfully"
        })
        fetchCoordinatorData() // Refresh data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!coordinator) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Failed to load coordinator settings</p>
          <Button 
            variant="outline" 
            onClick={fetchCoordinatorData}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email address"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            View your account details and security information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unique Login Code</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={coordinator.uniqueCode}
                  readOnly
                  className="bg-muted"
                />
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                This is your unique identifier for logging in
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Chapter Assignment</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={coordinator.chapterName}
                  readOnly
                  className="bg-muted"
                />
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                The chapter you are assigned to coordinate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Support & Contact
          </CardTitle>
          <CardDescription>
            Need help? Contact system administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Need to Change Your Login Code or Chapter?
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                For security reasons, login codes and chapter assignments can only be changed by system administrators.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Please contact your system administrator with any requests to modify these settings.
              </p>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Account ID:</strong> {coordinator.id}</p>
              <p><strong>Chapter ID:</strong> {coordinator.chapterId}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
