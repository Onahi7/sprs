"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Phone, Building2, Edit, Trash2, Plus } from "lucide-react"

interface Supervisor {
  id: number
  chapterId: number
  centerId: number
  name: string
  phoneNumber: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  centerName?: string
}

interface Center {
  id: number
  name: string
  chapterId: number
}

export function SupervisorsManagement() {
  const { toast } = useToast()
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    centerId: ""
  })

  useEffect(() => {
    fetchSupervisors()
    fetchCenters()
  }, [])

  const fetchSupervisors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coordinator/supervisors')
      if (response.ok) {
        const data = await response.json()
        setSupervisors(data.supervisors || [])
      }
    } catch (error) {
      console.error('Error fetching supervisors:', error)
      toast({
        title: "Error",
        description: "Failed to load supervisors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/coordinator/centers')
      if (response.ok) {
        const data = await response.json()
        setCenters(data.centers || [])
      }
    } catch (error) {
      console.error('Error fetching centers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phoneNumber || (!formData.centerId && !editingSupervisor)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingSupervisor 
        ? '/api/coordinator/supervisors'
        : '/api/coordinator/supervisors'
      
      const method = editingSupervisor ? 'PUT' : 'POST'
      
      const body = editingSupervisor 
        ? { id: editingSupervisor.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Supervisor ${editingSupervisor ? 'updated' : 'added'} successfully`,
        })
        setIsDialogOpen(false)
        setEditingSupervisor(null)
        setFormData({ name: "", phoneNumber: "", centerId: "" })
        fetchSupervisors()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${editingSupervisor ? 'update' : 'add'} supervisor`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor)
    setFormData({
      name: supervisor.name,
      phoneNumber: supervisor.phoneNumber,
      centerId: supervisor.centerId.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (supervisorId: number) => {
    if (!confirm("Are you sure you want to remove this supervisor?")) {
      return
    }

    try {
      const response = await fetch(`/api/coordinator/supervisors?id=${supervisorId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Supervisor removed successfully",
        })
        fetchSupervisors()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to remove supervisor",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    }
  }

  const getAvailableCenters = () => {
    const occupiedCenterIds = supervisors
      .filter(s => s.isActive)
      .map(s => s.centerId)
    
    return centers.filter(center => !occupiedCenterIds.includes(center.id))
  }

  const resetForm = () => {
    setFormData({ name: "", phoneNumber: "", centerId: "" })
    setEditingSupervisor(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supervisors Management</CardTitle>
          <CardDescription>Manage supervisors for your centers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeSupervisors = supervisors.filter(s => s.isActive)
  const availableCenters = getAvailableCenters()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Supervisors Management</CardTitle>
            <CardDescription>
              Assign one supervisor per center ({activeSupervisors.length}/{centers.length} centers have supervisors)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={availableCenters.length === 0 && !editingSupervisor}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supervisor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingSupervisor ? "Edit Supervisor" : "Add New Supervisor"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSupervisor 
                      ? "Update supervisor information" 
                      : "Add a supervisor for one of your centers"
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter supervisor's full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  
                  {!editingSupervisor && (
                    <div className="space-y-2">
                      <Label htmlFor="center">Center</Label>
                      <Select 
                        value={formData.centerId} 
                        onValueChange={(value) => setFormData({ ...formData, centerId: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a center" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id.toString()}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableCenters.length === 0 && (
                        <p className="text-sm text-orange-600">
                          All centers already have supervisors assigned.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSupervisor ? "Update" : "Add"} Supervisor
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeSupervisors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No supervisors added yet</p>
              <p className="text-sm">Add supervisors to manage your centers</p>
            </div>
          ) : (            <div className="grid gap-4 md:grid-cols-2">
              {activeSupervisors.map((supervisor) => (
                <div
                  key={`supervisor-${supervisor.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{supervisor.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {supervisor.phoneNumber}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Building2 className="h-3 w-3 mr-1" />
                        {supervisor.centerName || `Center ${supervisor.centerId}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(supervisor)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(supervisor.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {centers.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {centers.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Centers</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {activeSupervisors.length}
                  </div>
                  <div className="text-sm text-gray-600">Centers with Supervisors</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {centers.length - activeSupervisors.length}
                  </div>
                  <div className="text-sm text-gray-600">Centers Need Supervisors</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
