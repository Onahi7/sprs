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

  useEffect(() => {
    // Registration closes on July 8th, 2025 at 12:00 AM (midnight)
    const deadline = new Date('2025-07-08T00:00:00')

    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = deadline.getTime() - now.getTime()

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, total: difference })
      setIsExpired(false)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  return { timeLeft, isExpired, deadline: new Date('2025-07-08T00:00:00') }
}
