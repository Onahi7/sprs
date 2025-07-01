'use client'

import { useEffect, useState } from 'react'

export interface UserSession {
  id?: number
  username?: string
  role: "admin" | "coordinator"
  chapterId?: number
  chapterName?: string
}

export function useSession() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session')
        if (response.ok) {
          const data = await response.json()
          setSession(data.session)
        } else {
          setSession(null)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session')
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  return { session, loading, error }
}
