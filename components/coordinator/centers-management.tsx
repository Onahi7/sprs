"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, MapPin, Users } from "lucide-react"

// Define types
type Center = {
  id: number
  name: string
  chapterId: number
  chapterName?: string
  registrationCount?: number
}

export function CentersManagement() {
  const { toast } = useToast()
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  useEffect(() => {
    async function fetchCenters() {
      setLoading(true)
      try {
        const queryParams = new URLSearchParams({
          search: searchQuery
        })
        
        const res = await fetch(`/api/coordinator/centers?${queryParams.toString()}`)
        const data = await res.json()
        
        if (data.centers) {
          setCenters(data.centers)
        }
      } catch (error) {
        console.error("Error fetching centers:", error)
        toast({
          title: "Error",
          description: "Failed to load centers",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchCenters()
  }, [searchQuery, toast])
    const filteredCenters = centers.filter(center => 
    center.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exam Centers</CardTitle>
              <CardDescription>View and manage your assigned exam centers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search centers..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>                <TableHeader>
                  <TableRow>
                    <TableHead>Center Name</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Registrations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCenters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No centers found matching your search
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCenters.map((center) => (
                      <TableRow key={center.id}>
                        <TableCell className="font-medium">{center.name}</TableCell>
                        <TableCell>{center.chapterName || 'Unknown Chapter'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {center.registrationCount || 0}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
