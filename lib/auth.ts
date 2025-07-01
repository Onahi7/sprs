// --- NextAuth options for API routes ---
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // TODO: Replace with real user lookup
        if (credentials?.username === "admin" && credentials?.password === "admin") {
          return { id: "1", name: "Admin", role: "admin" } as any
        }
        return null
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (!session.user) session.user = {} as any
      // TypeScript: session.user is now always defined
      if (token?.role) (session.user as any).role = token.role as string
      if (token?.id) (session.user as any).id = token.id as string
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
      }
      return token
    }
  }
}
import { cookies } from "next/headers"
import * as jose from 'jose'
import { chapterCoordinators } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

export interface UserSession {
  id?: number
  username?: string
  role: "admin" | "coordinator"
  chapterId?: number
  chapterName?: string
  name?: string
  email?: string
}

/**
 * Get the current user session from the cookies
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value
  
  if (!token) {
    return null
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
    
    // Using jose library for Edge Runtime compatibility
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    
    const decoded = payload as unknown as UserSession & { exp: number };
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp < now) {
      return null
    }
    
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      chapterId: decoded.chapterId,
      chapterName: decoded.chapterName
    }
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error("getSession: Token verification failed:", error)
    }
    return null
  }
}

/**
 * Check if the current user has permission for a specific action
 */
export async function checkPermission(requiredRole: "admin" | "coordinator" | "any"): Promise<boolean> {
  const session = await getSession()
  
  if (!session) {
    return false
  }
  
  if (requiredRole === "any") {
    return true
  }
  
  return session.role === requiredRole
}

/**
 * Generate a random alpha-numeric code of specified length
 */
export function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Create auth token for a user session
 */
export async function createAuthToken(session: UserSession): Promise<string> {
  const secretKey = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
  const secret = new TextEncoder().encode(secretKey);
  
  // Using jose library for Edge Runtime compatibility
  return await new jose.SignJWT({ ...session })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

/**
 * Set auth token cookie
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  })
}

/**
 * Clear auth token cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
}

/**
 * Validate coordinator login code
 */
export async function validateCoordinatorCode(code: string) {
  const db = getDbConnection()
  
  const coordinator = await db.query.chapterCoordinators.findFirst({
    where: eq(chapterCoordinators.uniqueCode, code),
    with: {
      chapter: true
    }
  })
  
  if (!coordinator || !coordinator.chapter) {
    return null
  }
  
  return {
    id: coordinator.id,
    name: coordinator.name,
    email: coordinator.email,
    role: "coordinator" as const,
    chapterId: coordinator.chapterId,
    chapterName: coordinator.chapter.name
  }
}
