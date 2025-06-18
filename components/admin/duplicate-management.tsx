"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertTriangle, 
  Trash2, 
  Users, 
  Calendar, 
  School, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw
} from "lucide-react"

interface DuplicateRegistration {
  id: number
  registrationNumber: string
  firstName: string
  middleName?: string
  lastName: string
  schoolName?: string
  paymentStatus: string
  createdAt: string
  coordinatorRegisteredBy?: number
}

interface DuplicateGroup {
  chapterId: number
  chapterName: string
  fullNameNormalized: string
  duplicateCount: number
  firstRegistration: string
  lastRegistration: string
  registrations: DuplicateRegistration[]
}

interface Chapter {
  id: number
  name: string
}

export function AdminDuplicateManagement() {
  const { toast } = useToast()
  
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalDuplicateGroups: 0,
    totalDuplicateRegistrations: 0,
    chaptersAffected: 0
  })

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    registration: DuplicateRegistration | null
    groupInfo: { chapterName: string, studentName: string } | null
  }>({
    isOpen: false,
    registration: null,
    groupInfo: null
  })
  const [deleteReason, setDeleteReason] = useState("")
  const [deleting, setDeleting] = useState(false)
  // Fetch chapters for filter
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch('/api/admin/chapters/list')
        if (response.ok) {
          const data = await response.json()
          setChapters(data.chapters || [])
        }
      } catch (error) {
        console.error('Error fetching chapters:', error)
      }
    }
    fetchChapters()
  }, [])

  // Fetch duplicate registrations
  const fetchDuplicates = async () => {
    try {
      setLoading(true)
      const url = selectedChapter === "all" 
        ? '/api/admin/duplicates'
        : `/api/admin/duplicates?chapterId=${selectedChapter}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setDuplicateGroups(data.duplicateGroups || [])
        setSummary(data.summary || {
          totalDuplicateGroups: 0,
          totalDuplicateRegistrations: 0,
          chaptersAffected: 0
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch duplicate registrations",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error)
      toast({
        title: "Error",
        description: "Failed to fetch duplicate registrations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDuplicates()
  }, [selectedChapter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDeleteRegistration = async () => {
    if (!deleteDialog.registration) return

    try {
      setDeleting(true)
      
      const response = await fetch(`/api/admin/duplicates/${deleteDialog.registration.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: deleteReason || 'Duplicate registration removal'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Registration Deleted",
          description: `Registration ${deleteDialog.registration.registrationNumber} has been deleted successfully. Coordinator has been notified.`,
        })
        
        // Refresh the duplicates list
        await fetchDuplicates()
        
        // Close dialog
        setDeleteDialog({ isOpen: false, registration: null, groupInfo: null })
        setDeleteReason("")
      } else {
        toast({
          title: "Delete Failed",
          description: data.error || "Failed to delete registration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting registration:', error)
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (registration: DuplicateRegistration, group: DuplicateGroup) => {
    setDeleteDialog({
      isOpen: true,
      registration,
      groupInfo: {
        chapterName: group.chapterName,
        studentName: `${registration.firstName} ${registration.middleName ? registration.middleName + ' ' : ''}${registration.lastName}`
      }
    })
    setDeleteReason("")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.totalDuplicateGroups}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Duplicate Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.totalDuplicateRegistrations}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Duplicates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {summary.chaptersAffected}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Chapters Affected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label htmlFor="chapter-filter">Filter by Chapter:</Label>
              </div>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select chapter" />
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
            
            <Button onClick={fetchDuplicates} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      {duplicateGroups.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No Duplicate Registrations Found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedChapter === "all" 
                  ? "All registrations appear to be unique across all chapters."
                  : "No duplicate registrations found in the selected chapter."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {duplicateGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Duplicate Name: {group.registrations[0]?.firstName} {group.registrations[0]?.lastName}</span>
                  </div>
                  <Badge variant="destructive">
                    {group.duplicateCount} Registrations
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Chapter: <strong>{group.chapterName}</strong> • 
                  First registered: {formatDate(group.firstRegistration)} • 
                  Last registered: {formatDate(group.lastRegistration)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {group.registrations.map((registration, regIndex) => (
                    <div 
                      key={registration.id}
                      className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {registration.firstName} {registration.middleName ? `${registration.middleName} ` : ''}{registration.lastName}
                            </span>
                            {getStatusIcon(registration.paymentStatus)}
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div className="flex items-center gap-2">
                              <strong>Registration #:</strong> 
                              <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                                {registration.registrationNumber}
                              </code>
                            </div>
                            
                            {registration.schoolName && (
                              <div className="flex items-center gap-2">
                                <School className="h-3 w-3" />
                                <span>{registration.schoolName}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>Registered: {formatDate(registration.createdAt)}</span>
                            </div>

                            {registration.coordinatorRegisteredBy && (
                              <div className="text-xs text-blue-600">
                                Coordinator Registration (ID: {registration.coordinatorRegisteredBy})
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(registration.paymentStatus)}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(registration, group)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => 
        !open && setDeleteDialog({ isOpen: false, registration: null, groupInfo: null })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Registration
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete this registration. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteDialog.registration && deleteDialog.groupInfo && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  <strong>Registration Details:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Student: {deleteDialog.groupInfo.studentName}</li>
                    <li>• Registration #: {deleteDialog.registration.registrationNumber}</li>
                    <li>• Chapter: {deleteDialog.groupInfo.chapterName}</li>
                    <li>• Status: {deleteDialog.registration.paymentStatus}</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="delete-reason">Reason for Deletion (optional)</Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Enter the reason for deleting this registration (will be sent to the coordinator)..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  The coordinator will be automatically notified via email about this deletion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ isOpen: false, registration: null, groupInfo: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRegistration}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
