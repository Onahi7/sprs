import { useState } from 'react'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  chapterName: string
  schoolName: string
  paymentStatus: string
  amount: number
  registrationDate: string
  registrationType: string
}

interface ReportsTableProps {
  data: Registration[]
  loading: boolean
}

export function ReportsTable({ data, loading }: ReportsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Registration>('registrationDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  // Filter and sort data
  const filteredData = data.filter(registration =>
    (registration.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (registration.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (registration.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (registration.chapterName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (registration.schoolName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize)

  const handleSort = (field: keyof Registration) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) { // Added null check for status
      case 'paid': // 'paid' corresponds to 'completed' in the backend
      case 'completed': // Explicitly handle 'completed'
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>
      // Removed 'failed' case as it's not a valid status
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge> // Handle null or undefined status
    }
  }

  const getRegistrationTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) { // Added null check for type
      case 'student':
        return <Badge variant="outline">Student</Badge>
      case 'coordinator':
        return <Badge className="bg-blue-100 text-blue-800">Coordinator</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="border rounded-lg">
          <div className="h-12 bg-gray-100 border-b"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 border-b animate-pulse">
              <div className="flex items-center h-full px-4 space-x-4">
                {[...Array(8)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded flex-1"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search registrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
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
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600">
        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} entries
        {searchTerm && ` (filtered from ${data.length} total entries)`}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('firstName')}
              >
                Name {sortField === 'firstName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('email')}
              >
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('chapterName')}
              >
                Chapter {sortField === 'chapterName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('schoolName')}
              >
                School {sortField === 'schoolName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('paymentStatus')}
              >
                Payment {sortField === 'paymentStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 text-right"
                onClick={() => handleSort('amount')}
              >
                Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('registrationDate')}
              >
                Date {sortField === 'registrationDate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((registration) => (
              <TableRow key={registration.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium">{registration.firstName} {registration.lastName}</div>
                    <div className="text-sm text-gray-600">{registration.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{registration.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{registration.chapterName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{registration.schoolName}</div>
                </TableCell>
                <TableCell>
                  {getRegistrationTypeBadge(registration.registrationType)}
                </TableCell>
                <TableCell>
                  {getPaymentStatusBadge(registration.paymentStatus)}
                </TableCell>                <TableCell className="text-right">
                  <div className="font-medium">₦{(typeof registration.amount === 'number' && !isNaN(registration.amount) ? registration.amount : 0).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(registration.registrationDate), 'yyyy-MM-dd')}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRegistration(registration)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                        <DialogDescription>
                          Complete information for this registration
                        </DialogDescription>
                      </DialogHeader>
                      {selectedRegistration && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Name</label>
                            <p className="text-sm">{selectedRegistration.firstName} {selectedRegistration.lastName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="text-sm">{selectedRegistration.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Phone</label>
                            <p className="text-sm">{selectedRegistration.phone}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Chapter</label>
                            <p className="text-sm">{selectedRegistration.chapterName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">School</label>
                            <p className="text-sm">{selectedRegistration.schoolName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Registration Type</label>
                            <p className="text-sm">{selectedRegistration.registrationType}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Payment Status</label>
                            <div className="mt-1">{getPaymentStatusBadge(selectedRegistration.paymentStatus)}</div>
                          </div>
                          <div>                            <label className="text-sm font-medium text-gray-600">Amount</label>
                            <p className="text-sm font-medium">₦{(typeof selectedRegistration.amount === 'number' && !isNaN(selectedRegistration.amount) ? selectedRegistration.amount : 0).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-600">Registration Date</label>
                            <p className="text-sm">{format(new Date(selectedRegistration.registrationDate), 'yyyy-MM-dd')}</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
