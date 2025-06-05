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
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Calendar, Search, Building2 } from "lucide-react"

// Define types
type Center = {
  id: number
  name: string
  chapterId: number
  chapterName: string
  createdAt: string
  registrations?: number
}

type Chapter = {
  id: number
  name: string
}

export function CentersManagement() {
  const { toast } = useToast()
  const [centers, setCenters] = useState<Center[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCenter, setEditingCenter] = useState<Center | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [chapterFilter, setChapterFilter] = useState("all")
  
  // Form state
  const [centerName, setCenterName] = useState("")
  const [selectedChapterId, setSelectedChapterId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    fetchCenters()
    fetchChapters()
  }, [])
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!formOpen) {
      setCenterName("")
      setSelectedChapterId("")
      setEditingCenter(null)
    }
  }, [formOpen])
  
  // Set form values when editing
  useEffect(() => {
    if (editingCenter) {
      setCenterName(editingCenter.name)
      setSelectedChapterId(editingCenter.chapterId.toString())
      setFormOpen(true)
    }
  }, [editingCenter])
  
  async function fetchCenters() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/centers")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCenters(data)
    } catch (error) {
      console.error("Error fetching centers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch centers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  async function fetchChapters() {
    try {
      const response = await fetch("/api/chapters")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setChapters(data)
    } catch (error) {
      console.error("Error fetching chapters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch chapters. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!centerName.trim() || !selectedChapterId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      const url = "/api/admin/centers"
      const method = editingCenter ? "PUT" : "POST"
      const body = editingCenter 
        ? { id: editingCenter.id, name: centerName.trim(), chapterId: selectedChapterId }
        : { name: centerName.trim(), chapterId: selectedChapterId }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save center")
      }
      
      toast({
        title: "Success",
        description: `Center ${editingCenter ? "updated" : "created"} successfully.`,
      })
      
      setFormOpen(false)
      fetchCenters()
    } catch (error) {
      console.error("Error saving center:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save center. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  async function handleDelete(center: Center) {
    if (center.registrations && center.registrations > 0) {
      toast({
        title: "Cannot Delete Center",
        description: "This center has registrations and cannot be deleted.",
        variant: "destructive",
      })
      return
    }
    
    if (!confirm(`Are you sure you want to delete "${center.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/centers?id=${center.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete center")
      }
      
      toast({
        title: "Success",
        description: "Center deleted successfully.",
      })
      
      fetchCenters()
    } catch (error) {
      console.error("Error deleting center:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete center. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Filter centers based on search query and chapter filter
  const filteredCenters = centers.filter((center) => {
    const matchesSearch = center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         center.chapterName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesChapter = chapterFilter === "all" || center.chapterId.toString() === chapterFilter
    return matchesSearch && matchesChapter
  })
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centers Management</h1>
          <p className="text-muted-foreground">
            Manage centers for each chapter
          </p>
        </div>
        
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCenter ? "Edit Center" : "Add New Center"}
              </DialogTitle>
              <DialogDescription>
                {editingCenter 
                  ? "Update the center information below."
                  : "Enter the details for the new center."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="centerName">Center Name</Label>
                  <Input
                    id="centerName"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="Enter center name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="chapterId">Chapter</Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
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
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting 
                    ? (editingCenter ? "Updating..." : "Creating...") 
                    : (editingCenter ? "Update Center" : "Create Center")
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Centers
          </CardTitle>
          <CardDescription>
            View and manage all centers across chapters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search centers or chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={chapterFilter} onValueChange={setChapterFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id.toString()}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {filteredCenters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || chapterFilter !== "all" 
                ? "No centers found matching your criteria." 
                : "No centers found. Add your first center to get started."
              }
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center Name</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell className="font-medium">{center.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {center.chapterName || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {center.registrations || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(center.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCenter(center)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(center)}
                            disabled={center.registrations && center.registrations > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
