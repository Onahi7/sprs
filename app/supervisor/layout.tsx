"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, User, School, MapPin } from "lucide-react"

interface SupervisorData {
  id: number
  name: string
  phoneNumber: string
  schoolName?: string
  centerId: number
  chapterId: number
}

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [supervisor, setSupervisor] = useState<SupervisorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    const token = localStorage.getItem('supervisor_token')
    const supervisorData = localStorage.getItem('supervisor_data')

    if (!token || !supervisorData) {
      router.push('/supervisor/login')
      return
    }

    try {
      setSupervisor(JSON.parse(supervisorData))
    } catch (error) {
      console.error('Error parsing supervisor data:', error)
      router.push('/supervisor/login')
      return
    }

    setLoading(false)
  }, [router, mounted])

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('supervisor_token')
      if (token) {
        await fetch(`/api/supervisor/auth?token=${token}`, {
          method: 'DELETE'
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('supervisor_token')
      localStorage.removeItem('supervisor_data')
      toast({
        title: "Success",
        description: "Logged out successfully",
      })
      router.push('/supervisor/login')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!supervisor) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  Supervisor Portal
                </h1>
              </div>
              <div className="hidden md:block ml-6">
                <div className="flex space-x-8">
                  <button
                    onClick={() => router.push('/supervisor')}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/supervisor/attendance')}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Attendance
                  </button>
                  <button
                    onClick={() => router.push('/supervisor/reports')}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Reports
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Supervisor Info */}
              <div className="hidden sm:flex sm:items-center sm:space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{supervisor.name}</span>
                {supervisor.schoolName && (
                  <>
                    <span>•</span>
                    <School className="h-4 w-4" />
                    <span>{supervisor.schoolName}</span>
                  </>
                )}
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-3">
            <button
              onClick={() => router.push('/supervisor')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/supervisor/attendance')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Attendance
            </button>
            <button
              onClick={() => router.push('/supervisor/reports')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Supervisor Info Bar (Mobile) */}
      <div className="sm:hidden bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-blue-800">
              <User className="h-4 w-4" />
              <span className="font-medium">{supervisor.name}</span>
            </div>
            {supervisor.schoolName && (
              <div className="flex items-center space-x-1 text-blue-700">
                <School className="h-3 w-3" />
                <span className="text-xs">{supervisor.schoolName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
