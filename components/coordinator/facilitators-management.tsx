"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Phone, Edit, Trash2, Plus } from "lucide-react"

interface Facilitator {
  id: number
  name: string
  phoneNumber: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function FacilitatorsManagement() {
  const { toast } = useToast()
  const [facilitators, setFacilitators] = useState<Facilitator[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFacilitator, setEditingFacilitator] = useState<Facilitator | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    position: 1
  })

  useEffect(() => {
    fetchFacilitators()
  }, [])

  const fetchFacilitators = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/coordinator/facilitators')
      if (response.ok) {
        const data = await response.json()
        setFacilitators(data.facilitators || [])
      }
    } catch (error) {
      console.error('Error fetching facilitators:', error)
      toast({
        title: "Error",
        description: "Failed to load facilitators",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const method = editingFacilitator ? 'PUT' : 'POST'
      const body = editingFacilitator 
        ? { ...formData, id: editingFacilitator.id }
        : formData

      const response = await fetch('/api/coordinator/facilitators', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Facilitator ${editingFacilitator ? 'updated' : 'added'} successfully`,
        })
        fetchFacilitators()
        resetForm()
        setIsDialogOpen(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save facilitator",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving facilitator:', error)
      toast({
        title: "Error",
        description: "Failed to save facilitator",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (facilitator: Facilitator) => {
    setEditingFacilitator(facilitator)
    setFormData({
      name: facilitator.name,
      phoneNumber: facilitator.phoneNumber,
      position: facilitator.position
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this facilitator?')) {
      return
    }

    try {
      const response = await fetch(`/api/coordinator/facilitators?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Facilitator removed successfully",
        })
        fetchFacilitators()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to remove facilitator",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting facilitator:', error)
      toast({
        title: "Error",
        description: "Failed to remove facilitator",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      position: 1
    })
    setEditingFacilitator(null)
  }

  const getAvailablePosition = () => {
    const usedPositions = facilitators.filter(f => f.isActive).map(f => f.position)
    return usedPositions.includes(1) ? 2 : 1
  }

  const canAddFacilitator = () => {
    const activeCount = facilitators.filter(f => f.isActive).length
    return activeCount < 2
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chapter Facilitators</CardTitle>
          <CardDescription>Manage your chapter's facilitators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chapter Facilitators</CardTitle>
            <CardDescription>
              Manage your chapter's facilitators (up to 2 per chapter)
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                disabled={!canAddFacilitator()}
                onClick={() => {
                  resetForm()
                  if (canAddFacilitator()) {
                    setFormData(prev => ({ ...prev, position: getAvailablePosition() }))
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Facilitator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingFacilitator ? 'Edit Facilitator' : 'Add New Facilitator'}
                </DialogTitle>
                <DialogDescription>
                  Enter the facilitator's information below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter facilitator's full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Badge variant="outline">
                    Facilitator {formData.position}
                  </Badge>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingFacilitator ? 'Update' : 'Add'} Facilitator
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {facilitators.filter(f => f.isActive).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No facilitators added yet</p>
              <p className="text-sm">Add up to 2 facilitators for your chapter</p>
            </div>
          ) : (
            facilitators
              .filter(f => f.isActive)
              .sort((a, b) => a.position - b.position)
              .map((facilitator) => (
                <div
                  key={facilitator.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{facilitator.name}</h3>
                        <Badge variant="outline">
                          Position {facilitator.position}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        {facilitator.phoneNumber}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(facilitator)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(facilitator.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
        
        {facilitators.filter(f => f.isActive).length < 2 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              You can add {2 - facilitators.filter(f => f.isActive).length} more facilitator(s) to your chapter.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
