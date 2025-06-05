"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"

// Define the Chapter type
type Chapter = {
  id: number
  name: string
  amount: number
  splitCode?: string
  createdAt: string
  coordinators?: number
  schools?: number
  centers?: number
  registrations?: number
}

export function ChaptersManagement() {
  const { toast } = useToast()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
    // Form state
  const [chapterName, setChapterName] = useState("")
  const [amount, setAmount] = useState("")
  const [splitCode, setSplitCode] = useState("")
  
  useEffect(() => {
    fetchChapters()
  }, [])
    // Reset form when dialog closes
  useEffect(() => {
    if (!formOpen) {
      setChapterName("")
      setAmount("")
      setSplitCode("")
      setEditingChapter(null)
    }
  }, [formOpen])
    // Set form values when editing
  useEffect(() => {
    if (editingChapter) {
      setChapterName(editingChapter.name)
      setAmount(editingChapter.amount.toString())
      setSplitCode(editingChapter.splitCode || "")
      setFormOpen(true)
    }
  }, [editingChapter])
  
  async function fetchChapters() {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Form validation
    if (!chapterName.trim()) {
      toast({
        title: "Validation Error",
        description: "Chapter name is required",
        variant: "destructive"
      })
      return
    }
      if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Valid amount is required",
        variant: "destructive"
      })
      return
    }
    
    try {
      const method = editingChapter ? "PUT" : "POST"
      const url = editingChapter 
        ? `/api/admin/chapters/${editingChapter.id}` 
        : "/api/admin/chapters"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },        body: JSON.stringify({
          name: chapterName,
          amount: Number(amount),
          splitCode: splitCode || null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save chapter")
      }
      
      toast({
        title: "Success",
        description: editingChapter 
          ? "Chapter updated successfully" 
          : "New chapter created successfully"
      })
      
      // Close form and refresh chapters
      setFormOpen(false)
      fetchChapters()
      
    } catch (error) {
      console.error("Error saving chapter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save chapter",
        variant: "destructive"
      })
    }
  }
  
  async function handleDelete(chapter: Chapter) {
    if (!confirm(`Are you sure you want to delete ${chapter.name}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/chapters/${chapter.id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete chapter")
      }
      
      toast({
        title: "Success",
        description: "Chapter deleted successfully"
      })
      
      fetchChapters()
    } catch (error) {
      console.error("Error deleting chapter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete chapter",
        variant: "destructive"
      })
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Chapters</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? "Edit Chapter" : "Add New Chapter"}
              </DialogTitle>
              <DialogDescription>
                {editingChapter 
                  ? "Update chapter information" 
                  : "Create a new chapter in the system"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Chapter Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Abuja Chapter"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                  />
                </div>
                  <div className="grid gap-2">
                  <Label htmlFor="amount">Exam Fee (₦)</Label>
                  <Input 
                    id="amount" 
                    placeholder="e.g., 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="0"
                    step="100"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="splitCode">
                    Paystack Split Code (Optional)
                  </Label>
                  <Input 
                    id="splitCode" 
                    placeholder="e.g., SPL_xxxxxxxx"
                    value={splitCode}
                    onChange={(e) => setSplitCode(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This code is used for revenue sharing within Paystack
                  </p>
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
                  {editingChapter ? "Save Changes" : "Create Chapter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Chapters</CardTitle>
          <CardDescription>
            Manage chapters and their exam fees
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
          ) : chapters.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No chapters found. Click "Add New Chapter" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Exam Fee</TableHead>
                  <TableHead>Split Code</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapters.map((chapter) => (
                  <TableRow key={chapter.id}>                    <TableCell className="font-medium">{chapter.name}</TableCell>
                    <TableCell>₦{chapter.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {chapter.splitCode || <span className="text-muted-foreground text-sm">Not set</span>}
                    </TableCell>
                    <TableCell>{chapter.registrations || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setEditingChapter(chapter)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => handleDelete(chapter)}
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
