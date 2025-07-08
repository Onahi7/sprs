"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Search, RefreshCw, AlertCircle, Settings } from "lucide-react"
import { format } from "date-fns"
import { AdvancedExport } from "./advanced-export"

// Define types
type Registration = {
  id: number
  registrationNumber: string
  firstName: string
  lastName: string
  chapterId: number
  schoolId?: number
  schoolName?: string
  centerId: number
  paymentStatus: "pending" | "completed"
  coordinatorRegisteredBy?: number
  registrationType: "public" | "coordinator"
  createdAt: string
  chapter?: {
    id: number
    name: string
  }
  school?: {
    id: number
    name: string
  }

  center?: {
    id: number
    name: string
  }
}

type Center = {
  id: number
  name: string
}

type School = {
  id: number | null
  name: string
  chapterId?: number
  isManual?: boolean
}

export function RegistrationsManagement() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter')
  
  // State management
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [centers, setCenters] = useState<Center[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [centerFilter, setCenterFilter] = useState("all")
  const [schoolFilter, setSchoolFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [duplicatesFilter, setDuplicatesFilter] = useState<boolean>(filterParam === 'duplicates')
  const [showAdvancedExport, setShowAdvancedExport] = useState(false)
  
  // Fetch centers and schools for the coordinator
  useEffect(() => {
    async function fetchFiltersData() {
      try {
        // Fetch centers
        const centersRes = await fetch('/api/coordinator/centers')
        const centersData = await centersRes.json()
        
        if (centersData.centers) {
          setCenters(centersData.centers)
        }

        // Fetch schools
        const schoolsRes = await fetch('/api/coordinator/schools')
        const schoolsData = await schoolsRes.json()
        
        if (schoolsData.schools) {
          setSchools(schoolsData.schools)
        }
      } catch (error) {
        console.error("Error fetching filter data:", error)
      }
    }
    
    fetchFiltersData()
  }, [])
  
  // Fetch registrations with filters and pagination
  const fetchRegistrations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
      try {      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(centerFilter !== "all" && { centerId: centerFilter }),
        ...(schoolFilter !== "all" && { schoolId: schoolFilter }),
        ...(paymentFilter !== "all" && { paymentStatus: paymentFilter }),
        ...(sortBy && { sortBy })
      })
      
      // Use the duplicates endpoint if we're filtering for duplicates
      const endpoint = duplicatesFilter 
        ? `/api/coordinator/duplicates` 
        : `/api/coordinator/registrations`
      
      const res = await fetch(`${endpoint}?${queryParams.toString()}`)
      const data = await res.json()
      
      if (res.ok && data.registrations) {
        setRegistrations(data.registrations)
        setTotal(data.pagination?.total || data.total || 0)
        setTotalPages(Math.ceil((data.pagination?.total || data.total || 0) / pageSize))
      } else {
        throw new Error(data.error || 'Failed to fetch registrations')
      }
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }  // Fetch registrations on component mount and when filters change
  useEffect(() => {
    fetchRegistrations()
  }, [page, pageSize, searchQuery, centerFilter, schoolFilter, paymentFilter, sortBy, duplicatesFilter])
  
  // Reset to first page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  }, [pageSize, searchQuery, centerFilter, schoolFilter, paymentFilter, sortBy, duplicatesFilter])
  // Handle export
  const handleExport = async () => {
    try {      const queryParams = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(centerFilter !== "all" && { centerId: centerFilter }),
        ...(schoolFilter !== "all" && { schoolId: schoolFilter }),
        ...(paymentFilter !== "all" && { paymentStatus: paymentFilter }),
        ...(sortBy && { sortBy }),
        export: "true",
        ...(duplicatesFilter && { filter: 'duplicates' })
      })
      
      const res = await fetch(`/api/coordinator/registrations?${queryParams.toString()}`)
      
      if (!res.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `coordinator-registrations-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Registrations exported successfully",
      })
    } catch (error) {
      console.error("Error exporting registrations:", error)
      toast({
        title: "Error",
        description: "Failed to export registrations",
        variant: "destructive",
      })    }
  }
  
  // Function to download registration slip
  const downloadRegistrationSlip = async (registrationNumber: string) => {
    try {
      const response = await fetch(`/api/registrations/${registrationNumber}/slip`)
      
      if (!response.ok) {
        throw new Error('Failed to generate registration slip')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registration-slip-${registrationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Registration Slip Downloaded",
        description: `Registration slip for ${registrationNumber} downloaded successfully.`,
      })
    } catch (error) {
      console.error('Error downloading registration slip:', error)
      toast({
        title: "Download Error",
        description: "Failed to download registration slip.",
        variant: "destructive"
      })
    }
  }
  
  // Function to bulk download all registration slips as ZIP
  const handleBulkDownload = async () => {
    try {
      setRefreshing(true)
      
      const response = await fetch('/api/coordinator/registrations/bulk-download')
      
      if (!response.ok) {
        throw new Error('Failed to generate bulk download')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registration-slips-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Bulk Download Complete",
        description: "All registration slips downloaded successfully as ZIP file.",
      })
    } catch (error) {
      console.error('Error downloading bulk registration slips:', error)
      toast({
        title: "Download Error",
        description: "Failed to download registration slips.",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }
  
  // Generate pagination items
  const generatePaginationItems = () => {
    const items = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      // Always show first page
      items.push(1)
      
      // Show current page and neighbors
      const startPage = Math.max(2, page - 1)
      const endPage = Math.min(totalPages - 1, page + 1)
      
      if (startPage > 2) {
        items.push('ellipsis')
      }
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(i)
      }
      
      if (endPage < totalPages - 1) {
        items.push('ellipsis')
      }
      
      // Always show last page
      if (totalPages > 1) {
        items.push(totalPages)
      }
    }
    
    return items
  }    // Filter options
  const paymentOptions = [
    { label: "All Payments", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Pending", value: "pending" }
  ]
  const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Name (A-Z)", value: "name" },
    { label: "Registration Number", value: "regnum" }
  ]

  const pageSizeOptions = [
    { label: "10 per page", value: 10 },
    { label: "20 per page", value: 20 },
    { label: "50 per page", value: 50 },
    { label: "100 per page", value: 100 }
  ]
  
  // Get pagination items
  const paginationItems = generatePaginationItems()
  
  // Handle duplicates filter changes from URL
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setDuplicatesFilter(urlParams.get('filter') === 'duplicates');
    };

    // Listen for back/forward navigation
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update document title based on current view
  useEffect(() => {
    if (duplicatesFilter) {
      document.title = "Duplicate Registrations | NAPPS SPRS";
    } else {
      document.title = "Registrations | NAPPS SPRS";
    }
  }, [duplicatesFilter]);

  return (
    <div className="space-y-4">
      {/* Advanced Export Panel */}
      {showAdvancedExport && (
        <AdvancedExport />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Registrations</CardTitle>
              <CardDescription>View and manage student registrations made with your slot balance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {duplicatesFilter && (
                <Alert className="m-0 p-2 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                  <AlertDescription className="text-amber-800 text-sm flex items-center justify-between w-full">
                    <span>Showing duplicate registrations only</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 ml-2 text-amber-800 hover:text-amber-900 hover:bg-amber-100"
                      onClick={() => {
                        setDuplicatesFilter(false);
                        // Update URL without the filter parameter
                        const url = new URL(window.location.href);
                        url.searchParams.delete('filter');
                        window.history.pushState({}, '', url);
                      }}
                    >
                      Clear Filter
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchRegistrations(true)}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport} 
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Quick CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedExport(!showAdvancedExport)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Advanced Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBulkDownload}
                disabled={refreshing}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download All Slips
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or number..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Payment Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={centerFilter} onValueChange={setCenterFilter}>
                  <SelectTrigger id="center">
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

                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger id="school">
                    <SelectValue placeholder="School" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools.map((school) => (
                      <SelectItem 
                        key={school.id || `manual_${school.name}`} 
                        value={school.id ? school.id.toString() : `manual_${school.name}`}
                      >
                        {school.name} {school.isManual ? "(Manual)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No registrations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">
                            {registration.firstName} {registration.lastName}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {registration.registrationNumber}
                          </TableCell>
                          <TableCell>
                            {registration.school?.name || registration.schoolName || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {registration.center?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registration.paymentStatus === "completed" 
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            }`}>
                              {registration.paymentStatus === "completed" ? "Paid" : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(registration.createdAt), 'PP')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => downloadRegistrationSlip(registration.registrationNumber)}
                              disabled={registration.paymentStatus !== "completed"}
                              className="whitespace-nowrap"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>                      ))
                    )}
                  </TableBody></Table>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Items per page:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            if (page > 1) setPage(page - 1)
                          }}
                          className={page === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {paginationItems.map((item, i) => (
                        item === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={`page-${item}`}>
                            <PaginationLink 
                              onClick={() => setPage(item as number)}
                              isActive={page === item}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            if (page < totalPages) setPage(page + 1)
                          }}
                          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                {total > 0 ? (
                  <p>
                    Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} registration{total !== 1 ? 's' : ''}
                  </p>
                ) : (
                  <p>No registrations found</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
