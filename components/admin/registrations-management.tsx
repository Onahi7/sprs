"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Search, Download, FileText, Eye } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Define types
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
  paymentStatus: "pending" | "completed"
  splitCodeUsed: string | null
  paymentReference: string | null
  createdAt: string
}

type Chapter = {
  id: number
  name: string
}

type PaginationInfo = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function RegistrationsManagement() {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [chapterFilter, setChapterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [splitCodeFilter, setSplitCodeFilter] = useState("all")
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })
  
  useEffect(() => {
    fetchChapters()
  }, [])
    useEffect(() => {
    fetchRegistrations()
  }, [pagination.page, chapterFilter, statusFilter, splitCodeFilter, searchQuery])
  
  async function fetchRegistrations() {
    setLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
        if (chapterFilter !== "all") {
        params.append("chapterId", chapterFilter)
      }
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      if (splitCodeFilter !== "all") {
        params.append("splitCode", splitCodeFilter)
      }
      
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      
      const response = await fetch(`/api/admin/registrations?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch registrations")
      }
      
      const data = await response.json()
      setRegistrations(data.registrations)
      setPagination({
        ...pagination,
        total: data.total,
        totalPages: Math.ceil(data.total / pagination.limit)
      })
    } catch (error) {
      console.error("Error fetching registrations:", error)
      toast({
        title: "Error",
        description: "Failed to load registrations. Please try again.",
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
  
  async function handleExportCsv() {
    try {
      toast({
        title: "Preparing export...",
        description: "Please wait while we prepare your data export.",
      })
      
      // Build query params for export
      const params = new URLSearchParams()
      
      if (chapterFilter !== "all") {
        params.append("chapterId", chapterFilter)
      }
        if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }
      
      if (splitCodeFilter !== "all") {
        params.append("splitCode", splitCodeFilter)
      }
      
      if (searchQuery) {
        params.append("search", searchQuery)
      }
      
      const response = await fetch(`/api/admin/export-registrations?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Export failed")
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registrations-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Export successful",
        description: "Your data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    // Reset to first page when searching
    setPagination({...pagination, page: 1})
    // fetchRegistrations() will be called via useEffect
  }
  
  function viewRegistration(id: number) {
    // In a real app, this would open a modal or navigate to a details page
    toast({
      title: "View Registration",
      description: `Viewing details for registration ID: ${id}`,
    })
  }
  
  function printRegistration(regNumber: string) {
    // In a real app, this would open a print dialog or download a PDF
    toast({
      title: "Print Registration",
      description: `Printing slip for ${regNumber}`,
    })
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
          <h1 className="text-3xl font-bold tracking-tight">Student Registrations</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <Button onClick={handleExportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
          <CardDescription>
            Manage and view all student registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or registration number..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select
                value={chapterFilter}
                onValueChange={(value) => {
                  setChapterFilter(value)
                  setPagination({...pagination, page: 1})
                }}
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
                <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  setPagination({...pagination, page: 1})
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={splitCodeFilter}
                onValueChange={(value) => {
                  setSplitCodeFilter(value)
                  setPagination({...pagination, page: 1})
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Split code usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="with_split_code">With Split Code</SelectItem>
                  <SelectItem value="without_split_code">No Split Code</SelectItem>
                </SelectContent>
              </Select>
              
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>
          </div>
          
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No registrations found matching your criteria.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg. Number</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Split Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.registrationNumber}</TableCell>
                        <TableCell>
                          {reg.firstName} {reg.middleName ? reg.middleName + " " : ""}{reg.lastName}
                        </TableCell>
                        <TableCell>{reg.chapterName}</TableCell>
                        <TableCell>{reg.schoolName}</TableCell>
                        <TableCell>
                          {reg.splitCodeUsed ? (
                            <Badge variant="secondary" className="text-xs">
                              {reg.splitCodeUsed}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">No split code</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(reg.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={reg.paymentStatus === "completed" ? "default" : "outline"}>
                            {reg.paymentStatus === "completed" ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => viewRegistration(reg.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => printRegistration(reg.registrationNumber)}
                              disabled={reg.paymentStatus !== "completed"}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                          disabled={pagination.page <= 1}
                        />
                      </PaginationItem>

                      {/* Show page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum = pagination.page - 2 + i
                        if (pagination.page < 3) {
                          pageNum = i + 1
                        } else if (pagination.page > pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        }

                        // Ensure page number is within valid range
                        if (pageNum > 0 && pageNum <= pagination.totalPages) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={pagination.page === pageNum}
                                onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                          disabled={pagination.page >= pagination.totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              
              <div className="text-xs text-center text-muted-foreground mt-4">
                Showing {registrations.length} of {pagination.total} registrations
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
