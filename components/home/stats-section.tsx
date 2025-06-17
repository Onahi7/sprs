"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, CheckCircle, MapPin, Users } from "lucide-react"
import { LoadingStats } from "@/components/shared/loading"
import { Skeleton } from "@/components/ui/skeleton"

type StatsData = {
  totalRegistrations: number
  totalChapters: number
  totalSchools: number
  completionRate: number
}

export function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats")
        if (!response.ok) throw new Error("Failed to fetch stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
        // Set default fallback data
        setStats({
          totalRegistrations: 0,
          totalChapters: 0,
          totalSchools: 0,
          completionRate: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [mounted])

  if (!mounted || loading) {
    return (
      <section className="py-12 md:py-16 bg-white dark:bg-gray-950 w-full">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
          <LoadingStats />
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-gray-950 w-full">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalRegistrations.toLocaleString() || "0"}</div>
                  <p className="text-xs text-muted-foreground">Students registered nationwide</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Chapters</CardTitle>
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalChapters.toLocaleString() || "0"}</div>
                  <p className="text-xs text-muted-foreground">Chapters across the country</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Schools</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalSchools.toLocaleString() || "0"}</div>
                  <p className="text-xs text-muted-foreground">Participating schools</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.completionRate.toFixed(1) || "0"}%</div>
                  <p className="text-xs text-muted-foreground">Registration completion rate</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
