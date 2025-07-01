"use client"

// filepath: c:\Users\HP\Downloads\sprs\components\auth\logout-button.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      setLoading(true)
      
      // Call the logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      // Clear any client-side storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Force a hard redirect to ensure clean state
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Logging out..." : "Logout"}
    </Button>
  )
}
