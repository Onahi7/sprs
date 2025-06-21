// Simple in-memory rate limiter for result lookups
// In production, you'd want to use Redis or similar

const rateLimitMap = new Map()

const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // max 10 requests per IP per window
}

export function checkRateLimit(ip: string): { success: boolean; remainingRequests?: number } {
  const now = Date.now()
  const key = `result_lookup:${ip}`
  
  // Get existing requests for this IP
  const requests = rateLimitMap.get(key) || []
  
  // Remove old requests outside the window
  const validRequests = requests.filter((timestamp: number) => 
    now - timestamp < RATE_LIMIT.windowMs
  )
  
  // Check if limit exceeded
  if (validRequests.length >= RATE_LIMIT.maxRequests) {
    return { success: false }
  }
  
  // Add current request
  validRequests.push(now)
  rateLimitMap.set(key, validRequests)
  
  return { 
    success: true, 
    remainingRequests: RATE_LIMIT.maxRequests - validRequests.length 
  }
}

// Clean up old entries periodically (basic cleanup)
setInterval(() => {
  const now = Date.now()
  for (const [key, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter((timestamp: number) => 
      now - timestamp < RATE_LIMIT.windowMs
    )
    
    if (validRequests.length === 0) {
      rateLimitMap.delete(key)
    } else {
      rateLimitMap.set(key, validRequests)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
