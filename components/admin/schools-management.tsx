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
import { Plus, Edit, Trash2, Calendar, Search } from "lucide-react"

// Define types
type School = {
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

export function SchoolsManagement() {
  const { toast } = useToast()
  const [schools, setSchools] = useState<School[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [chapterFilter, setChapterFilter] = useState("all")
  
  // Form state
  const [schoolName, setSchoolName] = useState("")
  const [selectedChapterId, setSelectedChapterId] = useState("")
  
  useEffect(() => {
    fetchSchools()
    fetchChapters()
  }, [])
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!formOpen) {
      setSchoolName("")
      setSelectedChapterId("")
      setEditingSchool(null)
    }
  }, [formOpen])
  
  // Set form values when editing
  useEffect(() => {
    if (editingSchool) {
      setSchoolName(editingSchool.name)
      setSelectedChapterId(editingSchool.chapterId.toString())
      setFormOpen(true)
    }
  }, [editingSchool])
  
  async function fetchSchools() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/schools")
      if (!response.ok) {
        throw new Error("Failed to fetch schools")
      }
      
      const data = await response.json()
      setSchools(data)
    } catch (error) {
      console.error("Error fetching schools:", error)
      toast({
        title: "Error",
        description: "Failed to load schools. Please try again.",
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
    if (!schoolName.trim()) {
      toast({
        title: "Validation Error",
        description: "School name is required",
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
      const method = editingSchool ? "PUT" : "POST"
      const url = editingSchool 
        ? `/api/admin/schools/${editingSchool.id}` 
        : "/api/admin/schools"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: schoolName,
          chapterId: parseInt(selectedChapterId)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save school")
      }
      
      toast({
        title: "Success",
        description: editingSchool 
          ? "School updated successfully" 
          : "New school created successfully"
      })
      
      // Close form and refresh schools
      setFormOpen(false)
      fetchSchools()
      
    } catch (error) {
      console.error("Error saving school:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save school",
        variant: "destructive"
      })
    }
  }
  
  async function handleDelete(school: School) {
    if (!confirm(`Are you sure you want to delete ${school.name}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/schools/${school.id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete school")
      }
      
      toast({
        title: "Success",
        description: "School deleted successfully"
      })
      
      fetchSchools()
    } catch (error) {
      console.error("Error deleting school:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete school",
        variant: "destructive"
      })
    }
  }
  
  // Filter schools based on search query and chapter filter
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          school.chapterName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChapter = chapterFilter === "all" || 
                           school.chapterId.toString() === chapterFilter;
    
    return matchesSearch && matchesChapter;
  });
  
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
          <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? "Edit School" : "Add New School"}
              </DialogTitle>
              <DialogDescription>
                {editingSchool 
                  ? "Update school information" 
                  : "Create a new school in the system"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">School Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Model Secondary School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
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
                  {editingSchool ? "Save Changes" : "Create School"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Schools</CardTitle>
          <CardDescription>
            Manage schools in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select
              value={chapterFilter}
              onValueChange={setChapterFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
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
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {searchQuery || chapterFilter !== "all" 
                ? "No schools found matching your search criteria." 
                : "No schools found. Click 'Add New School' to create one."
              }
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.chapterName}</TableCell>
                    <TableCell>{school.registrations || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setEditingSchool(school)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDelete(school)}
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
