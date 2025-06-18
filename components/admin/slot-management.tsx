"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Loader2, 
  Plus, 
  Search, 
  RefreshCw, 
  Users, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  CreditCard,
  History
} from "lucide-react"

interface Chapter {
  id: number
  name: string
}

interface Coordinator {
  id: number
  name: string
  email: string
  chapterId: number
  chapterName: string
  availableSlots: number
  usedSlots: number
  totalPurchasedSlots: number
  lastPurchaseDate?: string
  lastUsageDate?: string
}

export function AdminSlotManagement() {
  const { toast } = useToast()
  
  // State variables
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  
  // Add slots form state
  const [showAddSlotsDialog, setShowAddSlotsDialog] = useState(false)
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null)
  const [slotsToAdd, setSlotsToAdd] = useState<number>(0)
  const [addSlotsReason, setAddSlotsReason] = useState("")

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch coordinators with slot information
      const coordinatorsResponse = await fetch('/api/admin/coordinators/slots')
      const coordinatorsData = await coordinatorsResponse.json()
      
      if (coordinatorsResponse.ok) {
        setCoordinators(coordinatorsData)
      } else {
        throw new Error(coordinatorsData.error || 'Failed to fetch coordinators')
      }
      
      // Fetch chapters
      const chaptersResponse = await fetch('/api/admin/chapters')
      const chaptersData = await chaptersResponse.json()
      
      if (chaptersResponse.ok) {
        setChapters(chaptersData)
      } else {
        throw new Error(chaptersData.error || 'Failed to fetch chapters')
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load coordinator data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter coordinators based on search and chapter selection
  const filteredCoordinators = coordinators.filter(coordinator => {
    const matchesSearch = coordinator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coordinator.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coordinator.chapterName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesChapter = selectedChapter === "all" || coordinator.chapterId.toString() === selectedChapter
    
    return matchesSearch && matchesChapter
  })

  // Handle adding slots to coordinator
  const handleAddSlots = async () => {
    if (!selectedCoordinator || slotsToAdd <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a coordinator and enter a valid number of slots",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/admin/coordinators/add-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinatorId: selectedCoordinator.id,
          slotsToAdd,
          reason: addSlotsReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add slots')
      }

      toast({
        title: "Slots Added Successfully",
        description: `Added ${slotsToAdd} slots to ${selectedCoordinator.name}. New balance: ${data.newBalance} slots.`,
      })

      // Reset form and refresh data
      setShowAddSlotsDialog(false)
      setSelectedCoordinator(null)
      setSlotsToAdd(0)
      setAddSlotsReason("")
      fetchData()

    } catch (error) {
      console.error('Error adding slots:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add slots",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openAddSlotsDialog = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator)
    setSlotsToAdd(0)
    setAddSlotsReason("")
    setShowAddSlotsDialog(true)
  }

  const getTotalSlots = () => {
    return filteredCoordinators.reduce((total, coord) => total + coord.totalPurchasedSlots, 0)
  }

  const getTotalAvailableSlots = () => {
    return filteredCoordinators.reduce((total, coord) => total + coord.availableSlots, 0)
  }

  const getTotalUsedSlots = () => {
    return filteredCoordinators.reduce((total, coord) => total + coord.usedSlots, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coordinator Slot Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and add slots for coordinators across all chapters
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Coordinators
              </p>
              <p className="text-2xl font-bold">{filteredCoordinators.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <CreditCard className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Slots Purchased
              </p>
              <p className="text-2xl font-bold">{getTotalSlots()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Zap className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Available Slots
              </p>
              <p className="text-2xl font-bold text-green-600">{getTotalAvailableSlots()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <History className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Used Slots
              </p>
              <p className="text-2xl font-bold text-gray-700">{getTotalUsedSlots()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Coordinators</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or chapter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label htmlFor="chapter">Filter by Chapter</Label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Chapters" />
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
          </div>
        </CardContent>
      </Card>

      {/* Coordinators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coordinators & Slot Balances</CardTitle>
          <CardDescription>
            View and manage slot balances for all coordinators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCoordinators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedChapter !== "all" 
                ? "No coordinators match your search criteria" 
                : "No coordinators found"
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coordinator</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Total Purchased</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoordinators.map((coordinator) => (
                    <TableRow key={coordinator.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{coordinator.name}</div>
                          <div className="text-sm text-gray-500">{coordinator.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{coordinator.chapterName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={coordinator.availableSlots > 0 ? "default" : "secondary"}
                          className={coordinator.availableSlots > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {coordinator.availableSlots}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{coordinator.usedSlots}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{coordinator.totalPurchasedSlots}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {coordinator.lastUsageDate && (
                            <div>Last used: {new Date(coordinator.lastUsageDate).toLocaleDateString()}</div>
                          )}
                          {coordinator.lastPurchaseDate && (
                            <div className="text-gray-500">
                              Last purchase: {new Date(coordinator.lastPurchaseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => openAddSlotsDialog(coordinator)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Slots
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Slots Dialog */}
      <Dialog open={showAddSlotsDialog} onOpenChange={setShowAddSlotsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Slots to Coordinator</DialogTitle>
            <DialogDescription>
              Add slots to {selectedCoordinator?.name} ({selectedCoordinator?.chapterName})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-balance">Current Slot Balance</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Available:</span>
                  <Badge variant="default">{selectedCoordinator?.availableSlots || 0}</Badge>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Used:</span>
                  <Badge variant="outline">{selectedCoordinator?.usedSlots || 0}</Badge>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Purchased:</span>
                  <Badge variant="secondary">{selectedCoordinator?.totalPurchasedSlots || 0}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slots-to-add">Slots to Add</Label>
              <Input
                id="slots-to-add"
                type="number"
                min="1"
                max="1000"
                value={slotsToAdd || ''}
                onChange={(e) => setSlotsToAdd(parseInt(e.target.value) || 0)}
                placeholder="Enter number of slots"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={addSlotsReason}
                onChange={(e) => setAddSlotsReason(e.target.value)}
                placeholder="e.g., Promotional slots, Support request, etc."
              />
            </div>
            
            {slotsToAdd > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  After adding {slotsToAdd} slots, {selectedCoordinator?.name} will have{' '}
                  <strong>{(selectedCoordinator?.availableSlots || 0) + slotsToAdd}</strong> available slots.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddSlotsDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddSlots}
              disabled={submitting || slotsToAdd <= 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {slotsToAdd} Slots
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
