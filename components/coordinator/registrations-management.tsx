"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Search, Calendar, Filter } from "lucide-react"
import { format } from "date-fns"

// Define types
type Registration = {
  id: number
  candidateName: string
  schoolName: string
  centerName: string
  status: string
  createdAt: string
  paymentStatus: string
  phoneNumber: string
}

export function RegistrationsManagement() {
  const { toast } = useToast()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [centerFilter, setCenterFilter] = useState("all")
  const [centers, setCenters] = useState<{ id: number, name: string }[]>([])
  
  useEffect(() => {
    // Fetch centers for the coordinator
    async function fetchCenters() {
      try {
        const res = await fetch('/api/coordinator/centers')
        const data = await res.json()
        
        if (data.centers) {
          setCenters(data.centers)
        }
      } catch (error) {
        console.error("Error fetching centers:", error)
      }
    }
    
    fetchCenters()
  }, [])
  
  useEffect(() => {
    async function fetchRegistrations() {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          status: statusFilter,
          payment: paymentFilter,
          center: centerFilter,
          search: searchQuery
        })
        
        const res = await fetch(`/api/coordinator/registrations?${queryParams.toString()}`)
        const data = await res.json()
        
        if (data.registrations) {
          setRegistrations(data.registrations)
          setTotalPages(data.totalPages || 1)
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
      }
    }
    
    fetchRegistrations()
  }, [page, statusFilter, paymentFilter, centerFilter, searchQuery, toast])
  
  async function handleExport() {
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        payment: paymentFilter,
        center: centerFilter,
        search: searchQuery
      })
      
      const res = await fetch(`/api/coordinator/export?${queryParams.toString()}`)
      
      if (!res.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `registrations-export-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
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
      })
    }
  }
  
  // Generate array for pagination
  const paginationItems = []
  const maxPagesToShow = 5
  
  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      paginationItems.push(i)
    }
  } else {
    // Always show first page
    paginationItems.push(1)
    
    // Show current page and neighbors
    const startPage = Math.max(2, page - 1)
    const endPage = Math.min(totalPages - 1, page + 1)
    
    if (startPage > 2) {
      paginationItems.push('ellipsis')
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(i)
    }
    
    if (endPage < totalPages - 1) {
      paginationItems.push('ellipsis')
    }
    
    // Always show last page
    paginationItems.push(totalPages)
  }
  
  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" }
  ]
  
  const paymentOptions = [
    { label: "All Payments", value: "all" },
    { label: "Paid", value: "paid" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Pending", value: "pending" }
  ]
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrations</CardTitle>
              <CardDescription>Manage exam registrations for your assigned centers</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search registrations..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Payment" />
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
                      <TableHead>Candidate Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Center</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Contact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No registrations found with the current filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrations.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>{registration.candidateName}</TableCell>
                          <TableCell>{registration.schoolName}</TableCell>
                          <TableCell>{registration.centerName}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registration.status === "approved" 
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                                : registration.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100" 
                                : "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                            }`}>
                              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registration.paymentStatus === "paid" 
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                                : registration.paymentStatus === "unpaid"
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100" 
                                : "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                            }`}>
                              {registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{format(new Date(registration.createdAt), 'PP')}</TableCell>
                          <TableCell>{registration.phoneNumber}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
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
                        <PaginationItem key={item}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => { 
                              e.preventDefault();
                              setPage(item as number);
                            }}
                            isActive={page === item}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => { 
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
