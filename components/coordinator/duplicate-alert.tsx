"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DuplicateAlertProps {
  coordinatorId: number
  chapterId: number
}

export function CoordinatorDuplicateAlert({ coordinatorId, chapterId }: DuplicateAlertProps) {
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkForDuplicates = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/coordinator/duplicates-check?chapterId=${chapterId}`)
        
        if (response.ok) {
          const data = await response.json()
          setDuplicateCount(data.duplicateCount || 0)
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error)
      } finally {
        setLoading(false)
      }
    }
    
    checkForDuplicates()
  }, [chapterId])

  if (loading || duplicateCount === 0) {
    return null
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-amber-800 dark:text-amber-300">
          <strong>Potential Duplicate Registrations Detected:</strong> {duplicateCount} duplicate student {duplicateCount === 1 ? 'name was' : 'names were'} found in your chapter.
        </div>
        <Button variant="outline" size="sm" asChild className="border-amber-300 text-amber-800 hover:bg-amber-100">
          <Link href="/coordinator/registrations?filter=duplicates">
            View Duplicates
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
