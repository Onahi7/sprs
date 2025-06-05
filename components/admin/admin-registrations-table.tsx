"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DownloadIcon, Search, FileText } from "lucide-react"
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

type Chapter = {
  id: number
  name: string
}

type Registration = {
  id: number
  registrationNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  chapterId: number
  schoolId: number
  schoolName: string | null
  paymentStatus: string
  createdAt: string
  chapter?: {
    name: string
  }
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

export function AdminRegistrationsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [chapterFilter, setChapterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch chapters for filter
        const chaptersResponse = await fetch("/api/chapters")
        if (!chaptersResponse.ok) throw new Error("Failed to fetch chapters")
        const chaptersData = await chaptersResponse.json()
        setChapters(chaptersData)

        // Fetch registrations with filters
        const registrationsResponse = await fetch(
          `/api/admin/registrations?page=${pagination.page}&limit=${pagination.limit}&search=${searchQuery}&chapterId=${chapterFilter}&status=${statusFilter}`,
        )

        if (!registrationsResponse.ok) throw new Error("Failed to fetch registrations")

        const data = await registrationsResponse.json()
        setRegistrations(data.registrations)
        setPagination(data.pagination)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pagination.page, pagination.limit, searchQuery, chapterFilter, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const exportToCsv = async () => {
    try {
      window.open(`/api/admin/export-registrations?chapterId=${chapterFilter}&status=${statusFilter}`, "_blank")
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
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        <div className="flex flex-wrap gap-2">
          <Select value={chapterFilter} onValueChange={setChapterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by chapter" />
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={exportToCsv}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Chapter</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="font-medium">{registration.registrationNumber}</TableCell>
                  <TableCell>
                    {registration.firstName} {registration.middleName ? registration.middleName + " " : ""}
                    {registration.lastName}
                  </TableCell>
                  <TableCell>{registration.chapter?.name || `Chapter ID: ${registration.chapterId}`}</TableCell>
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
                        size="sm"
                        onClick={() => handlePrintSlip(registration.registrationNumber)}
                        title="Print Registration Slip"
                      >
                        <FileText className="h-4 w-4" />
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
