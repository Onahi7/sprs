import { useState, useEffect } from "react"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function useRegistrationCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })
  const [isExpired, setIsExpired] = useState(false)
  const [isInGracePeriod, setIsInGracePeriod] = useState(false)

  useEffect(() => {
    // Original deadline: July 8th, 2025 at 12:00 AM (midnight)
    const originalDeadline = new Date('2025-07-08T00:00:00')
    // Grace period: 48 hours after original deadline
    const gracePeriodDeadline = new Date('2025-07-10T00:00:00') // July 10th, 2025

    const calculateTimeLeft = () => {
      const now = new Date()
      const originalDifference = originalDeadline.getTime() - now.getTime()
      const graceDifference = gracePeriodDeadline.getTime() - now.getTime()

      // Check if we're past the grace period
      if (graceDifference <= 0) {
        setIsExpired(true)
        setIsInGracePeriod(false)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        return
      }

      // Check if we're in the grace period (past original deadline but before grace deadline)
      if (originalDifference <= 0 && graceDifference > 0) {
        setIsInGracePeriod(true)
        setIsExpired(false)
        
        // Show time remaining in grace period
        const days = Math.floor(graceDifference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((graceDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((graceDifference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((graceDifference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds, total: graceDifference })
        return
      }

      // We're before the original deadline
      setIsInGracePeriod(false)
      setIsExpired(false)
      
      const days = Math.floor(originalDifference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((originalDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((originalDifference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((originalDifference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: originalDifference })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  return { 
    timeLeft, 
    isExpired, 
    isInGracePeriod,
    originalDeadline: new Date('2025-07-08T00:00:00'),
    gracePeriodDeadline: new Date('2025-07-10T00:00:00')
  }
}
