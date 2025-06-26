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
  console.log("Middleware: Processing request for", req.nextUrl.pathname)  // Public pages that don't require authentication
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
  
  console.log("Middleware: Is public page?", isPublicPage)

  const token = req.cookies.get("auth_token")?.value
  const isAuth = !!token
  console.log("Middleware: Auth token exists?", isAuth)
  
  let decodedToken: DecodedToken | null = null
  // Verify token if it exists
  if (token) {
    console.log("Middleware: Verifying token...")
    try {
      const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
      console.log("Middleware: Using JWT Secret:", jwtSecret.substring(0, 3) + "...")
      
      // Using jose library for Edge Runtime compatibility
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret);
      
      decodedToken = payload as unknown as DecodedToken;
      
      console.log("Middleware: Token verified, contains role:", decodedToken.role)
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < now) {
        console.log("Middleware: Token is expired, redirecting to login")
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
    } catch (error) {
      console.error("Middleware: Token verification failed:", error);
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }
  }
  
  const role = decodedToken?.role
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth/login")
  const isSupervisorRoute = req.nextUrl.pathname.startsWith("/supervisor")
  
  // Handle supervisor routes separately (they have their own authentication)
  if (isSupervisorRoute) {
    console.log("Middleware: Supervisor route detected, allowing access")
    return NextResponse.next()
  }
  
  // Only redirect unauthenticated users to login page if they're trying to access protected pages
  if (!isAuth && !isAuthPage && !isPublicPage) {
    console.log(`Middleware: User not authenticated, redirecting to login from ${req.nextUrl.pathname}`)
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }
  
  if (!isAuth) {
    console.log(`Middleware: User not authenticated on path ${req.nextUrl.pathname}, but allowing access (public page or auth page)`)
  }
  // Redirect authenticated users away from auth pages
  if (isAuth && isAuthPage) {
    console.log("Middleware: User already authenticated, redirecting from login page")
    if (role === "admin") {
      console.log("Middleware: Admin user detected, redirecting to admin dashboard")
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    if (role === "coordinator") {
      console.log("Middleware: Coordinator user detected, redirecting to coordinator dashboard")
      return NextResponse.redirect(new URL("/coordinator", req.url))
    }
    // If role is not recognized, redirect to home
    console.log("Middleware: User has unknown role:", role)
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Role-based access control
  if (isAuth && role) {
    console.log("Middleware: Checking role-based access, user role:", role)
    
    // Admin routes protection
    if (req.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      console.log("Middleware: Non-admin user trying to access admin routes, redirecting")
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Coordinator routes protection
    if (req.nextUrl.pathname.startsWith("/coordinator") && role !== "coordinator") {
      console.log("Middleware: Non-coordinator user trying to access coordinator routes, redirecting")
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    console.log("Middleware: Role-based access check passed")  }

  console.log(`Middleware: Access granted for path ${req.nextUrl.pathname}, auth status: ${isAuth}, role: ${role || 'none'}`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
