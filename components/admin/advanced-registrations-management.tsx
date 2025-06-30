"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { 
  Calendar, Search, Download, FileText, Eye, Edit, Trash2, 
  Users, Settings, Upload, CheckCircle, XCircle, MapPin,
  School, Building, CreditCard, Clock, Save, X, Plus,
  AlertTriangle, Filter, RefreshCw, Copy, Archive
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { RegistrationDetailView } from "./registration-detail-view"
import { BulkImportExport } from "./bulk-import-export"
import { PaginationSummary } from "./pagination-summary"
import { ClientOnly } from "@/components/shared/client-only"

// Types
type Registration = {
  id: number
  registrationNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  chapterId: number
  chapterName: string
  schoolId: number | null
  schoolName: string
  centerId: number | null
  centerName: string | null
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  paymentStatus: "pending" | "completed"
  splitCodeUsed: string | null
  paymentReference: string | null
  passportUrl: string
  registrationType: "public" | "coordinator"
  coordinatorRegisteredBy: number | null
  coordinatorName: string | null
  createdAt: string
}

type Chapter = {
  id: number
  name: string
  splitCode: string | null
  amount: string
}

type School = {
  id: number
  name: string
  chapterId: number
}

type Center = {
  id: number
  name: string
  chapterId: number
}

type EditRegistrationData = {
  firstName: string
  middleName: string
  lastName: string
  chapterId: number
  schoolId: number | null
  schoolName: string
  centerId: number | null
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  paymentStatus: "pending" | "completed"
}

type BulkAction = "change_center" | "change_chapter" | "change_payment_status" | "delete" | "export"

export function AdvancedRegistrationsManagement() {
  const { toast } = useToast()
  
  // State
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<number>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [chapterFilter, setChapterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [centerFilter, setCenterFilter] = useState("all")
  
  // Edit states
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null)
  const [editFormData, setEditFormData] = useState<EditRegistrationData | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  // Detail view states
  const [viewingRegistrationId, setViewingRegistrationId] = useState<number | null>(null)
  const [showDetailView, setShowDetailView] = useState(false)
  
  // Bulk action states
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null)
  const [bulkTargetChapter, setBulkTargetChapter] = useState("")
  const [bulkTargetCenter, setBulkTargetCenter] = useState("")
  const [bulkTargetStatus, setBulkTargetStatus] = useState<"pending" | "completed" | "">("")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    Promise.all([
      fetchRegistrations(),
      fetchChapters(),
      fetchSchools(),
      fetchCenters()
    ])
  }, [currentPage, pageSize, chapterFilter, statusFilter, typeFilter, centerFilter, searchQuery])

  async function fetchRegistrations() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(chapterFilter !== "all" && { chapterId: chapterFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(centerFilter !== "all" && { centerId: centerFilter }),
        ...(searchQuery && { search: searchQuery })
      })
      
      const response = await fetch(`/api/admin/registrations/advanced?${params}`)
      if (!response.ok) throw new Error("Failed to fetch registrations")
      
      const data = await response.json()
      setRegistrations(data.registrations)
      setTotalPages(data.pagination.totalPages)
      setTotalRecords(data.pagination.total)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchChapters() {
    try {
      const response = await fetch("/api/admin/chapters")
      if (!response.ok) throw new Error("Failed to fetch chapters")
      const data = await response.json()
      setChapters(data)
    } catch (error) {
      console.error("Error fetching chapters:", error)
    }
  }

  async function fetchSchools() {
    try {
      const response = await fetch("/api/admin/schools")
      if (!response.ok) throw new Error("Failed to fetch schools")
      const data = await response.json()
      setSchools(data)
    } catch (error) {
      console.error("Error fetching schools:", error)
    }
  }

  async function fetchCenters() {
    try {
      const response = await fetch("/api/admin/centers")
      if (!response.ok) throw new Error("Failed to fetch centers")
      const data = await response.json()
      setCenters(data)
    } catch (error) {
      console.error("Error fetching centers:", error)
    }
  }

  // Selection handlers
  function toggleRegistrationSelection(id: number) {
    const newSelected = new Set(selectedRegistrations)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRegistrations(newSelected)
  }

  function toggleSelectAll() {
    if (selectedRegistrations.size === registrations.length) {
      setSelectedRegistrations(new Set())
    } else {
      setSelectedRegistrations(new Set(registrations.map(r => r.id)))
    }
  }

  // Edit handlers
  function startEditRegistration(registration: Registration) {
    setEditingRegistration(registration)
    setEditFormData({
      firstName: registration.firstName,
      middleName: registration.middleName || "",
      lastName: registration.lastName,
      chapterId: registration.chapterId,
      schoolId: registration.schoolId,
      schoolName: registration.schoolName,
      centerId: registration.centerId,
      parentFirstName: registration.parentFirstName,
      parentLastName: registration.parentLastName,
      parentPhone: registration.parentPhone,
      parentEmail: registration.parentEmail,
      paymentStatus: registration.paymentStatus
    })
    setShowEditDialog(true)
  }

  // Detail view handlers
  function viewRegistrationDetails(id: number) {
    setViewingRegistrationId(id)
    setShowDetailView(true)
  }

  function handleDetailViewEdit(registration: any) {
    setShowDetailView(false)
    startEditRegistration(registration)
  }

  // Pagination handlers
  function handlePageSizeChange(newPageSize: string) {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  async function saveRegistrationEdit() {
    if (!editingRegistration || !editFormData) return
    
    try {
      const response = await fetch(`/api/admin/registrations/${editingRegistration.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      })
      
      if (!response.ok) throw new Error("Failed to update registration")
      
      toast({
        title: "Success",
        description: "Registration updated successfully"
      })
      
      setShowEditDialog(false)
      fetchRegistrations()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update registration",
        variant: "destructive"
      })
    }
  }

  // Bulk action handlers
  function startBulkAction(action: BulkAction) {
    if (selectedRegistrations.size === 0) {
      toast({
        title: "No selections",
        description: "Please select registrations first",
        variant: "destructive"
      })
      return
    }
    
    setBulkAction(action)
    setShowBulkDialog(true)
  }

  async function executeBulkAction() {
    if (!bulkAction || selectedRegistrations.size === 0) return
    
    try {
      const registrationIds = Array.from(selectedRegistrations)
      let payload: any = { registrationIds }
      
      switch (bulkAction) {
        case "change_center":
          if (!bulkTargetCenter) {
            toast({ title: "Error", description: "Please select a center", variant: "destructive" })
            return
          }
          payload.centerId = parseInt(bulkTargetCenter)
          break
        case "change_chapter":
          if (!bulkTargetChapter) {
            toast({ title: "Error", description: "Please select a chapter", variant: "destructive" })
            return
          }
          payload.chapterId = parseInt(bulkTargetChapter)
          break
        case "change_payment_status":
          if (!bulkTargetStatus) {
            toast({ title: "Error", description: "Please select a payment status", variant: "destructive" })
            return
          }
          payload.paymentStatus = bulkTargetStatus
          break
        case "export":
          // Handle export differently
          const exportResponse = await fetch(`/api/admin/registrations/bulk-export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })
          
          if (!exportResponse.ok) throw new Error("Export failed")
          
          const blob = await exportResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `selected-registrations-export-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
          
          toast({
            title: "Success",
            description: `${selectedRegistrations.size} registrations exported successfully`
          })
          
          setShowBulkDialog(false)
          return
      }
      
      const response = await fetch(`/api/admin/registrations/bulk-${bulkAction.replace('_', '-')}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) throw new Error(`Failed to execute ${bulkAction}`)
      
      toast({
        title: "Success",
        description: `Bulk ${bulkAction.replace('_', ' ')} completed successfully`
      })
      
      setShowBulkDialog(false)
      setSelectedRegistrations(new Set())
      fetchRegistrations()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to execute bulk action`,
        variant: "destructive"
      })
    }
  }

  async function deleteRegistration(id: number) {
    try {
      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: "DELETE"
      })
      
      if (!response.ok) throw new Error("Failed to delete registration")
      
      toast({
        title: "Success",
        description: "Registration deleted successfully"
      })
      
      fetchRegistrations()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete registration",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Registration Management</h1>
          <p className="text-muted-foreground">
            Comprehensive tools for managing student registrations, bulk operations, and data oversight
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchRegistrations()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => startBulkAction("export")}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold text-green-600">
                  {registrations.filter(r => r.paymentStatus === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">
                  {registrations.filter(r => r.paymentStatus === "pending").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-xs font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedRegistrations.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Management</CardTitle>
          <CardDescription>
            View, edit, and manage student registrations with advanced filtering and bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, registration number, or parent details..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <ClientOnly fallback={<div className="h-10 w-[160px] bg-muted animate-pulse rounded"></div>}>
                  <Select value={chapterFilter} onValueChange={setChapterFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Chapter" />
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
                </ClientOnly>
                
                <ClientOnly fallback={<div className="h-10 w-[140px] bg-muted animate-pulse rounded"></div>}>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </ClientOnly>
                
                <ClientOnly fallback={<div className="h-10 w-[140px] bg-muted animate-pulse rounded"></div>}>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                    </SelectContent>
                  </Select>
                </ClientOnly>
                
                <ClientOnly fallback={<div className="h-10 w-[140px] bg-muted animate-pulse rounded"></div>}>
                  <Select value={centerFilter} onValueChange={setCenterFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Center" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Centers</SelectItem>
                      {centers.map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </ClientOnly>
              </div>

              {/* Selection Actions */}
              {selectedRegistrations.size > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedRegistrations.size} registration(s) selected:
                  </span>
                  <Button size="sm" variant="outline" onClick={() => startBulkAction("change_center")}>
                    <MapPin className="mr-1 h-3 w-3" />
                    Change Center
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startBulkAction("change_chapter")}>
                    <Building className="mr-1 h-3 w-3" />
                    Change Chapter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startBulkAction("change_payment_status")}>
                    <CreditCard className="mr-1 h-3 w-3" />
                    Update Payment
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startBulkAction("export")}>
                    <Download className="mr-1 h-3 w-3" />
                    Export Selected
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Registrations</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedRegistrations.size} registration(s)? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => startBulkAction("delete")}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRegistrations(new Set())}>
                    <X className="mr-1 h-3 w-3" />
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Pagination Summary */}
              <PaginationSummary
                currentPage={currentPage}
                pageSize={pageSize}
                totalRecords={totalRecords}
                totalPages={totalPages}
                selectedCount={selectedRegistrations.size}
              />

              {/* Table */}
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedRegistrations.size === registrations.length && registrations.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Registration #</TableHead>
                        <TableHead>Chapter</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Center</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRegistrations.has(registration.id)}
                              onCheckedChange={() => toggleRegistrationSelection(registration.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {registration.firstName} {registration.middleName} {registration.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {registration.id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {registration.registrationNumber}
                          </TableCell>
                          <TableCell>{registration.chapterName}</TableCell>
                          <TableCell>{registration.schoolName}</TableCell>
                          <TableCell>
                            {registration.centerName ? (
                              <Badge variant="outline">{registration.centerName}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>{registration.parentFirstName} {registration.parentLastName}</div>
                              <div className="text-muted-foreground">{registration.parentPhone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={registration.paymentStatus === "completed" ? "default" : "secondary"}>
                              {registration.paymentStatus === "completed" ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={registration.registrationType === "coordinator" ? "secondary" : "outline"}>
                              {registration.registrationType === "coordinator" ? "Coordinator" : "Public"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDate(registration.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => startEditRegistration(registration)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => viewRegistrationDetails(registration.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Registration</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this registration? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteRegistration(registration.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} registrations
                  </span>
                  {selectedRegistrations.size > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedRegistrations.size} selected
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show:</span>
                    <ClientOnly fallback={<div className="h-10 w-20 bg-muted animate-pulse rounded"></div>}>
                      <Select 
                        value={pageSize.toString()} 
                        onValueChange={handlePageSizeChange}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </ClientOnly>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                  
                  {/* Page Navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  )}
                  
                  {/* Quick Jump to Page (show when there are many pages) */}
                  {totalPages > 10 && (
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                      <span className="text-sm text-muted-foreground">Go to:</span>
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        placeholder="Page"
                        className="w-16 h-8 text-center"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt(e.currentTarget.value)
                            if (page && page >= 1 && page <= totalPages) {
                              goToPage(page)
                              e.currentTarget.value = ''
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Operations</CardTitle>
                  <CardDescription>
                    Perform bulk operations on multiple registrations at once
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-24 flex-col"
                      onClick={() => startBulkAction("change_center")}
                    >
                      <MapPin className="h-6 w-6 mb-2" />
                      Change Centers
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex-col"
                      onClick={() => startBulkAction("change_chapter")}
                    >
                      <Building className="h-6 w-6 mb-2" />
                      Change Chapters
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex-col"
                      onClick={() => startBulkAction("change_payment_status")}
                    >
                      <CreditCard className="h-6 w-6 mb-2" />
                      Update Payments
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex-col"
                      onClick={() => startBulkAction("export")}
                    >
                      <Download className="h-6 w-6 mb-2" />
                      Export Data
                    </Button>
                  </div>
                  
                  <div className="text-center text-muted-foreground">
                    Select registrations from the List View tab to perform bulk operations
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="import-export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Import & Export Tools</CardTitle>
                  <CardDescription>
                    Advanced tools for bulk data operations and system integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BulkImportExport 
                    chapters={chapters}
                    onSuccess={fetchRegistrations}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Registration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update registration details for {editingRegistration?.registrationNumber}
            </DialogDescription>
          </DialogHeader>
          
          {editFormData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={editFormData.middleName}
                  onChange={(e) => setEditFormData({...editFormData, middleName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="chapter">Chapter</Label>
                <Select 
                  value={editFormData.chapterId.toString()} 
                  onValueChange={(value) => setEditFormData({...editFormData, chapterId: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Chapter" />
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
              
              <div>
                <Label htmlFor="school">School</Label>
                <Select 
                  value={editFormData.schoolId?.toString() || ""} 
                  onValueChange={(value) => setEditFormData({...editFormData, schoolId: value ? parseInt(value) : null})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools
                      .filter(school => school.chapterId === editFormData.chapterId)
                      .map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="center">Center</Label>
                <Select 
                  value={editFormData.centerId?.toString() || ""} 
                  onValueChange={(value) => setEditFormData({...editFormData, centerId: value ? parseInt(value) : null})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Center" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers
                      .filter(center => center.chapterId === editFormData.chapterId)
                      .map((center) => (
                        <SelectItem key={center.id} value={center.id.toString()}>
                          {center.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="parentFirstName">Parent First Name</Label>
                <Input
                  id="parentFirstName"
                  value={editFormData.parentFirstName}
                  onChange={(e) => setEditFormData({...editFormData, parentFirstName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="parentLastName">Parent Last Name</Label>
                <Input
                  id="parentLastName"
                  value={editFormData.parentLastName}
                  onChange={(e) => setEditFormData({...editFormData, parentLastName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="parentPhone">Parent Phone</Label>
                <Input
                  id="parentPhone"
                  value={editFormData.parentPhone}
                  onChange={(e) => setEditFormData({...editFormData, parentPhone: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="parentEmail">Parent Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={editFormData.parentEmail}
                  onChange={(e) => setEditFormData({...editFormData, parentEmail: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={editFormData.paymentStatus} 
                  onValueChange={(value: "pending" | "completed") => setEditFormData({...editFormData, paymentStatus: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveRegistrationEdit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "change_center" && "Change Center"}
              {bulkAction === "change_chapter" && "Change Chapter"}
              {bulkAction === "change_payment_status" && "Update Payment Status"}
              {bulkAction === "delete" && "Delete Registrations"}
              {bulkAction === "export" && "Export Registrations"}
            </DialogTitle>
            <DialogDescription>
              This action will affect {selectedRegistrations.size} registration(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {bulkAction === "change_center" && (
              <div>
                <Label htmlFor="bulkCenter">Select New Center</Label>
                <Select value={bulkTargetCenter} onValueChange={setBulkTargetCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Center" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id.toString()}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkAction === "change_chapter" && (
              <div>
                <Label htmlFor="bulkChapter">Select New Chapter</Label>
                <Select value={bulkTargetChapter} onValueChange={setBulkTargetChapter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Chapter" />
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
            )}
            
            {bulkAction === "change_payment_status" && (
              <div>
                <Label htmlFor="bulkStatus">Select Payment Status</Label>
                <Select value={bulkTargetStatus} onValueChange={(value: "pending" | "completed") => setBulkTargetStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {bulkAction === "delete" && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Warning: This action cannot be undone</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRegistrations.size} registration(s) will be permanently deleted
                  </p>
                </div>
              </div>
            )}
            
            {bulkAction === "export" && (
              <div className="text-sm text-muted-foreground">
                {selectedRegistrations.size} registration(s) will be exported to CSV format
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={executeBulkAction}
              variant={bulkAction === "delete" ? "destructive" : "default"}
            >
              {bulkAction === "delete" ? "Delete" : "Execute"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Detail View */}
      <RegistrationDetailView
        registrationId={viewingRegistrationId}
        isOpen={showDetailView}
        onClose={() => setShowDetailView(false)}
        onEdit={handleDetailViewEdit}
      />
    </div>
  )
}
