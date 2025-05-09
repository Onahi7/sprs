"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import type { UserSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DownloadIcon, Printer, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

type Registration = {
  id: number
  registrationNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  schoolId: number
  schoolName: string | null
  paymentStatus: string
  createdAt: string
  school?: {
    name: string
  }
}

type PaginationInfo = {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface RegistrationsTableProps {
  chapterId: number
}

interface Session {
  user: UserSession | null
}

export function RegistrationsTable({ chapterId }: RegistrationsTableProps) {
  const { data: session } = useSession() as { data: Session | null }
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!session?.user?.chapterId) return

      try {
        const response = await fetch(
          `/api/coordinator/registrations?chapterId=${session.user.chapterId}&page=${pagination.page}&limit=${pagination.limit}&search=${searchQuery}`,
        )

        if (!response.ok) throw new Error("Failed to fetch registrations")

        const data = await response.json()
        setRegistrations(data.registrations)
        setPagination(data.pagination)
      } catch (error) {
        console.error("Error fetching registrations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.chapterId) {
      fetchRegistrations()
    }
  }, [session, pagination.page, pagination.limit, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const exportToCsv = async () => {
    if (!session?.user?.chapterId) return

    try {
      window.open(`/api/coordinator/export?chapterId=${session.user.chapterId}`, "_blank")
    } catch (error) {
      console.error("Error exporting to CSV:", error)
    }
  }

  const handlePrintSlip = (registrationNumber: string) => {
    window.open(`/api/registrations/${registrationNumber}/slip`, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or registration number..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <Button variant="outline" onClick={exportToCsv}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.registrationNumber}</TableCell>
                  <TableCell>
                    {registration.firstName} {registration.middleName ? registration.middleName + " " : ""}
                    {registration.lastName}
                  </TableCell>
                  <TableCell>
                    {registration.schoolName ||
                      (registration.school ? registration.school.name : `School ID: ${registration.schoolId}`)}
                  </TableCell>
                  <TableCell>{formatDate(registration.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        registration.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {registration.paymentStatus === "completed" ? "Completed" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {registration.paymentStatus === "completed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrintSlip(registration.registrationNumber)}
                        title="Print Registration Slip"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page <= 1}
              />
            </PaginationItem>

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
      )}
    </div>
  )
}
