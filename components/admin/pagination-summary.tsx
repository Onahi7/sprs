"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, FileText, Users, Filter } from "lucide-react"

interface PaginationSummaryProps {
  currentPage: number
  pageSize: number
  totalRecords: number
  totalPages: number
  selectedCount: number
  filteredCount?: number
  totalUnfilteredCount?: number
}

export function PaginationSummary({
  currentPage,
  pageSize,
  totalRecords,
  totalPages,
  selectedCount,
  filteredCount,
  totalUnfilteredCount
}: PaginationSummaryProps) {
  const startRecord = ((currentPage - 1) * pageSize) + 1
  const endRecord = Math.min(currentPage * pageSize, totalRecords)
  const isFiltered = filteredCount !== undefined && totalUnfilteredCount !== undefined && filteredCount !== totalUnfilteredCount

  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">{startRecord}-{endRecord}</div>
            <div className="text-xs text-muted-foreground">Viewing</div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm font-medium">{totalRecords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {isFiltered ? 'Filtered' : 'Total'}
            </div>
          </div>
          
          {selectedCount > 0 && (
            <div className="flex flex-col items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium text-primary">{selectedCount}</div>
              <div className="text-xs text-muted-foreground">Selected</div>
            </div>
          )}
          
          {isFiltered && (
            <div className="flex flex-col items-center gap-1">
              <Filter className="h-4 w-4 text-orange-600" />
              <div className="text-sm font-medium">{totalUnfilteredCount?.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-muted-foreground">Page</div>
            <Badge variant="outline" className="text-sm">
              {currentPage} of {totalPages}
            </Badge>
            <div className="text-xs text-muted-foreground">{pageSize} per page</div>
          </div>
        </div>
        
        {isFiltered && (
          <div className="mt-3 pt-3 border-t text-center">
            <Badge variant="secondary" className="text-xs">
              Filters Active - Showing {((filteredCount / totalUnfilteredCount!) * 100).toFixed(1)}% of all records
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
