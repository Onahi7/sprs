"use client"

import { useEffect, useState } from "react"
import { SlotBalanceDisplay } from "./slot-balance-display"
import { useToast } from "@/hooks/use-toast"

interface SlotBalance {
  availableSlots: number
  usedSlots: number
  totalPurchasedSlots: number
  lastPurchaseDate?: Date
  lastUsageDate?: Date
}

interface SlotBalanceDisplayAutoProps {
  className?: string
  onBalanceUpdate?: (balance: SlotBalance) => void
  refreshInterval?: number // ms, default 30000 (30 seconds)
}

export function SlotBalanceDisplayAuto({ 
  className, 
  onBalanceUpdate, 
  refreshInterval = 30000 
}: SlotBalanceDisplayAutoProps) {
  const [slots, setSlots] = useState<SlotBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSlotBalance = async (showErrorToast = true) => {
    try {
      const response = await fetch('/api/coordinator/slots/balance')
      
      if (!response.ok) {
        throw new Error('Failed to fetch slot balance')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSlots({
          availableSlots: data.availableSlots,
          usedSlots: data.usedSlots,
          totalPurchasedSlots: data.totalPurchasedSlots,
          lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : undefined,
          lastUsageDate: data.lastUsageDate ? new Date(data.lastUsageDate) : undefined
        })
        setError(null)
        
        if (onBalanceUpdate) {
          onBalanceUpdate({
            availableSlots: data.availableSlots,
            usedSlots: data.usedSlots,
            totalPurchasedSlots: data.totalPurchasedSlots,
            lastPurchaseDate: data.lastPurchaseDate ? new Date(data.lastPurchaseDate) : undefined,
            lastUsageDate: data.lastUsageDate ? new Date(data.lastUsageDate) : undefined
          })
        }
      } else {
        throw new Error(data.error || 'Failed to load slot balance')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      if (showErrorToast) {
        toast({
          title: "Error Loading Slot Balance",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchSlotBalance()

    // Set up refresh interval
    const interval = setInterval(() => {
      fetchSlotBalance(false) // Don't show error toast on background refresh
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  if (error && !slots) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-sm">Failed to load slot balance</p>
        <button 
          onClick={() => fetchSlotBalance()}
          className="text-blue-600 text-xs underline mt-1"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <SlotBalanceDisplay 
      slots={slots ?? undefined} 
      loading={loading} 
      className={className} 
    />
  )
}
