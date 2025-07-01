// filepath: c:\Users\HP\Downloads\sprs\middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from 'jose'

interface DecodedToken {
  id?: number
  username?: string
  role: "admin" | "coordinator"
  chapterId?: number
  exp: number
}

export async function middleware(req: NextRequest) {
  // Public pages that don't require authentication
  const isPublicPage =
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/register" ||
    req.nextUrl.pathname === "/status" ||
    req.nextUrl.pathname === "/sw.js" ||
    req.nextUrl.pathname.startsWith("/payment") ||
    req.nextUrl.pathname.startsWith("/api/upload") ||
    req.nextUrl.pathname.startsWith("/api/registrations") ||
    req.nextUrl.pathname.startsWith("/api/chapters") ||
    req.nextUrl.pathname.startsWith("/api/schools") ||
    req.nextUrl.pathname.startsWith("/api/centers") ||
    req.nextUrl.pathname.startsWith("/api/payment") ||
    req.nextUrl.pathname.startsWith("/api/stats") ||
    req.nextUrl.pathname.startsWith("/api/testimonials") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/api/admin/login") ||
    req.nextUrl.pathname.startsWith("/api/coordinator/login") ||
    req.nextUrl.pathname.startsWith("/api/supervisor") ||
    req.nextUrl.pathname.startsWith("/supervisor/login") ||
    // Static assets
    req.nextUrl.pathname.endsWith(".svg") ||
    req.nextUrl.pathname.endsWith(".png") ||
    req.nextUrl.pathname.endsWith(".jpg") ||
    req.nextUrl.pathname.endsWith(".jpeg") ||
    req.nextUrl.pathname.endsWith(".gif") ||
    req.nextUrl.pathname.endsWith(".ico") ||
    req.nextUrl.pathname.endsWith(".css") ||
    req.nextUrl.pathname.endsWith(".js") ||
    req.nextUrl.pathname.endsWith(".map");

  const token = req.cookies.get("auth_token")?.value
  const isAuth = !!token
  
  let decodedToken: DecodedToken | null = null
  // Verify token if it exists
  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
      
      // Using jose library for Edge Runtime compatibility
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret);
      
      decodedToken = payload as unknown as DecodedToken;
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < now) {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    } catch (error) {
      // Token verification failed - redirect to login
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }
  }
  
  const role = decodedToken?.role
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth/login")
  const isSupervisorRoute = req.nextUrl.pathname.startsWith("/supervisor")
  
  // Handle supervisor routes separately (they have their own authentication)
  if (isSupervisorRoute) {
    return NextResponse.next()
  }
  
  // Only redirect unauthenticated users to login page if they're trying to access protected pages
  if (!isAuth && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuth && isAuthPage) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    if (role === "coordinator") {
      return NextResponse.redirect(new URL("/coordinator", req.url))
    }
    // If role is not recognized, redirect to home
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Role-based access control
  if (isAuth && role) {
    // Admin routes protection
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Coordinator routes protection
    if (req.nextUrl.pathname.startsWith("/coordinator") && role !== "coordinator") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
