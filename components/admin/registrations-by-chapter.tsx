"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  BarChart3
} from "lucide-react"

interface ChapterRegistration {
  chapterId: number
  chapterName: string
  totalRegistrations: number
  paidRegistrations: number
  pendingRegistrations: number
  totalRevenue: number
  registrationRate: number
}

export function RegistrationsByChapter() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ChapterRegistration[]>([])

  useEffect(() => {
    async function fetchRegistrationsByChapter() {
      try {
        setLoading(true)
        
        const response = await fetch('/api/admin/dashboard/registrations-by-chapter')
        
        if (!response.ok) {
          throw new Error('Failed to fetch registrations by chapter')
        }
        
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching registrations by chapter:", error)
        toast({
          title: "Error",
          description: "Failed to load registrations by chapter. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrationsByChapter()
  }, [toast])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Registrations by Chapter
          </CardTitle>
          <CardDescription>Loading chapter registration statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRegistrations = data.reduce((sum, chapter) => sum + chapter.totalRegistrations, 0)
  const totalRevenue = data.reduce((sum, chapter) => sum + chapter.totalRevenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Registrations by Chapter
        </CardTitle>
        <CardDescription>
          Total: {totalRegistrations.toLocaleString()} registrations | Revenue: ₦{totalRevenue.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No chapter data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data
              .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
              .map((chapter) => {
                const paymentSuccessRate = chapter.totalRegistrations > 0 
                  ? Math.round((chapter.paidRegistrations / chapter.totalRegistrations) * 100) 
                  : 0

                return (
                  <div key={chapter.chapterId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{chapter.chapterName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{chapter.totalRegistrations} total</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{chapter.paidRegistrations} paid</span>
                          </div>
                          {chapter.pendingRegistrations > 0 && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Clock className="h-4 w-4" />
                              <span>{chapter.pendingRegistrations} pending</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-semibold">₦{chapter.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                      
                      <Badge 
                        variant={paymentSuccessRate >= 80 ? "default" : paymentSuccessRate >= 60 ? "secondary" : "destructive"}
                        className="font-medium"
                      >
                        {paymentSuccessRate}%
                      </Badge>
                      
                      <div className="w-16 text-right">
                        <div className="text-lg font-bold">{chapter.totalRegistrations}</div>
                        <div className="text-xs text-muted-foreground">regs</div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
        
        {data.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{data.length}</div>
                <div className="text-sm text-muted-foreground">Active Chapters</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {data.reduce((sum, chapter) => sum + chapter.paidRegistrations, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Paid Registrations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {data.reduce((sum, chapter) => sum + chapter.pendingRegistrations, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Pending Payments</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {totalRegistrations > 0 ? Math.round((data.reduce((sum, chapter) => sum + chapter.paidRegistrations, 0) / totalRegistrations) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Success Rate</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
