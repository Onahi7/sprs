"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, Calendar, RefreshCw } from "lucide-react"
import { generateRandomCode } from "@/lib/auth"

// Define types
type Coordinator = {
  id: number
  name: string
  email: string
  uniqueCode: string
  chapterId: number
  chapterName: string
  createdAt: string
}

type Chapter = {
  id: number
  name: string
}

export function CoordinatorsManagement() {
  const { toast } = useToast()
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null)
  
  // Form state
  const [coordinatorName, setCoordinatorName] = useState("")
  const [coordinatorEmail, setCoordinatorEmail] = useState("")
  const [coordinatorCode, setCoordinatorCode] = useState("")
  const [selectedChapterId, setSelectedChapterId] = useState("")
  
  useEffect(() => {
    fetchCoordinators()
    fetchChapters()
  }, [])
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!formOpen) {
      setCoordinatorName("")
      setCoordinatorEmail("")
      setCoordinatorCode("")
      setSelectedChapterId("")
      setEditingCoordinator(null)
    }
  }, [formOpen])
  
  // Set form values when editing
  useEffect(() => {
    if (editingCoordinator) {
      setCoordinatorName(editingCoordinator.name)
      setCoordinatorEmail(editingCoordinator.email)
      setCoordinatorCode(editingCoordinator.uniqueCode)
      setSelectedChapterId(editingCoordinator.chapterId.toString())
      setFormOpen(true)
    }
  }, [editingCoordinator])
  
  async function fetchCoordinators() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/coordinators")
      if (!response.ok) {
        throw new Error("Failed to fetch coordinators")
      }
      
      const data = await response.json()
      setCoordinators(data)
    } catch (error) {
      console.error("Error fetching coordinators:", error)
      toast({
        title: "Error",
        description: "Failed to load coordinators. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function fetchChapters() {
    try {
      const response = await fetch("/api/admin/chapters")
      if (!response.ok) {
        throw new Error("Failed to fetch chapters")
      }
      
      const data = await response.json()
      setChapters(data)
    } catch (error) {
      console.error("Error fetching chapters:", error)
      toast({
        title: "Error",
        description: "Failed to load chapters. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Form validation
    if (!coordinatorName.trim()) {
      toast({
        title: "Validation Error",
        description: "Coordinator name is required",
        variant: "destructive"
      })
      return
    }
    
    if (!coordinatorEmail.trim() || !coordinatorEmail.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Valid email is required",
        variant: "destructive"
      })
      return
    }
    
    if (!coordinatorCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Unique code is required",
        variant: "destructive"
      })
      return
    }
    
    if (!selectedChapterId) {
      toast({
        title: "Validation Error",
        description: "Please select a chapter",
        variant: "destructive"
      })
      return
    }
      try {
      const method = editingCoordinator ? "PUT" : "POST"
      const url = editingCoordinator 
        ? `/api/admin/coordinators?id=${editingCoordinator.id}` 
        : "/api/admin/coordinators"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: coordinatorName,
          email: coordinatorEmail,
          uniqueCode: coordinatorCode,
          chapterId: parseInt(selectedChapterId)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save coordinator")
      }
      
      toast({
        title: "Success",
        description: editingCoordinator 
          ? "Coordinator updated successfully" 
          : "New coordinator created successfully"
      })
      
      // Close form and refresh coordinators
      setFormOpen(false)
      fetchCoordinators()
      
    } catch (error) {
      console.error("Error saving coordinator:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save coordinator",
        variant: "destructive"
      })
    }
  }
  
  async function handleDelete(coordinator: Coordinator) {
    if (!confirm(`Are you sure you want to delete coordinator ${coordinator.name}? This action cannot be undone.`)) {
      return
    }
      try {
      const response = await fetch(`/api/admin/coordinators?id=${coordinator.id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete coordinator")
      }
      
      toast({
        title: "Success",
        description: "Coordinator deleted successfully"
      })
      
      fetchCoordinators()
    } catch (error) {
      console.error("Error deleting coordinator:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete coordinator",
        variant: "destructive"
      })
    }
  }
  
  function generateNewCode() {
    // Use a random alphanumeric code
    setCoordinatorCode(Math.random().toString(36).substring(2, 10).toUpperCase())
  }
  
  // Get current date for display
  const today = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const formattedDate = today.toLocaleDateString('en-US', dateOptions)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinators</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Coordinator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCoordinator ? "Edit Coordinator" : "Add New Coordinator"}
              </DialogTitle>
              <DialogDescription>
                {editingCoordinator 
                  ? "Update coordinator information" 
                  : "Create a new coordinator for a chapter"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Coordinator Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., John Doe"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    placeholder="e.g., john.doe@example.com"
                    type="email"
                    value={coordinatorEmail}
                    onChange={(e) => setCoordinatorEmail(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="uniqueCode">Unique Login Code</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateNewCode}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input 
                    id="uniqueCode" 
                    placeholder="e.g., ABC123XY"
                    value={coordinatorCode}
                    onChange={(e) => setCoordinatorCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This code will be used by the coordinator to log in
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="chapterId">Chapter</Label>
                  <Select 
                    value={selectedChapterId} 
                    onValueChange={setSelectedChapterId}
                  >
                    <SelectTrigger id="chapterId">
                      <SelectValue placeholder="Select a chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem 
                          key={chapter.id} 
                          value={chapter.id.toString()}
                        >
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCoordinator ? "Save Changes" : "Create Coordinator"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Coordinators</CardTitle>
          <CardDescription>
            Manage chapter coordinators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : coordinators.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No coordinators found. Click "Add New Coordinator" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Unique Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordinators.map((coordinator) => (
                  <TableRow key={coordinator.id}>
                    <TableCell className="font-medium">{coordinator.name}</TableCell>
                    <TableCell>{coordinator.email}</TableCell>
                    <TableCell>{coordinator.chapterName}</TableCell>
                    <TableCell>{coordinator.uniqueCode}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setEditingCoordinator(coordinator)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDelete(coordinator)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
