// filepath: c:\Users\HP\Downloads\sprs\middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from 'jose'
import { getDbConnection } from "@/db/utils"
import { settings } from "@/db/schema"
import { eq } from "drizzle-orm"

interface DecodedToken {
  id?: number
  username?: string
  role: "admin" | "coordinator"
  chapterId?: number
  exp: number
}

// Check if registrations are enabled
async function isRegistrationEnabled() {
  try {
    const db = getDbConnection();
    const setting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'system.registration_enabled'))
      .limit(1);
    
    return setting.length === 0 || setting[0].value !== 'false';
  } catch (error) {
    console.error('Error checking registration status:', error);
    return true; // Default to enabled if there's an error
  }
}

// Check if payments are enabled
async function isPaymentEnabled() {
  try {
    const db = getDbConnection();
    const setting = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'system.payment_enabled'))
      .limit(1);
    
    return setting.length === 0 || setting[0].value !== 'false';
  } catch (error) {
    console.error('Error checking payment status:', error);
    return true; // Default to enabled if there's an error
  }
}

export async function middleware(req: NextRequest) {
  // Check registration status for protected routes first
  if (req.nextUrl.pathname === "/register") {
    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      return NextResponse.redirect(new URL("/registrations-closed", req.url));
    }
  }

  // Public pages that don't require authentication
  const isPublicPage =
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/status" ||
    req.nextUrl.pathname === "/sw.js" ||
    req.nextUrl.pathname === "/registrations-closed" ||
    req.nextUrl.pathname === "/coordinator/registrations-closed" ||
    req.nextUrl.pathname.startsWith("/payment") ||
    req.nextUrl.pathname.startsWith("/verify") ||
    req.nextUrl.pathname.startsWith("/student/results") ||
    req.nextUrl.pathname.startsWith("/api/verify") ||
    req.nextUrl.pathname.startsWith("/api/upload") ||
    req.nextUrl.pathname.startsWith("/api/chapters") ||
    req.nextUrl.pathname.startsWith("/api/schools") ||
    req.nextUrl.pathname.startsWith("/api/centers") ||
    req.nextUrl.pathname.startsWith("/api/payment") ||
    req.nextUrl.pathname.startsWith("/api/stats") ||
    req.nextUrl.pathname.startsWith("/api/testimonials") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/api/settings/status") ||
    req.nextUrl.pathname.startsWith("/api/admin/login") ||
    req.nextUrl.pathname.startsWith("/api/coordinator/login") ||
    req.nextUrl.pathname.startsWith("/api/supervisor") ||
    req.nextUrl.pathname.startsWith("/api/results") ||
    req.nextUrl.pathname.startsWith("/api/registrations/") || // Allow individual registration lookups
    req.nextUrl.pathname.startsWith("/api/students") ||
    req.nextUrl.pathname.startsWith("/api/admin/subjects") ||
    req.nextUrl.pathname.startsWith("/supervisor/login") ||
    req.nextUrl.pathname.startsWith("/result-entry") ||
    req.nextUrl.pathname.startsWith("/result-entry/login") ||
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

  // Block access to public registration page if registrations are disabled
  // Only admins can bypass this restriction
  if (req.nextUrl.pathname === "/register") {
    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      return NextResponse.redirect(new URL("/registrations-closed", req.url));
    }
  }
  
  // Block access to coordinator registration API and slot payment API if registrations/payments are disabled
  if (
    req.nextUrl.pathname.startsWith("/api/coordinator/register") || 
    req.nextUrl.pathname.startsWith("/coordinator/register") ||
    (req.nextUrl.pathname === "/api/registrations" && req.method === "POST")
  ) {
    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Registrations are currently closed", code: "REGISTRATIONS_CLOSED" },
          { status: 403 }
        );
      } else {
        return NextResponse.redirect(new URL("/coordinator/registrations-closed", req.url));
      }
    }
  }
  
  // Block access to payment endpoints if payments are disabled
  if (
    req.nextUrl.pathname.startsWith("/api/coordinator/payment/initialize") ||
    req.nextUrl.pathname.startsWith("/api/coordinator/slots")
  ) {
    const paymentEnabled = await isPaymentEnabled();
    if (!paymentEnabled) {
      return NextResponse.json(
        { error: "Payments are currently disabled", code: "PAYMENTS_DISABLED" },
        { status: 403 }
      );
    }
  }

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
  const isResultEntryRoute = req.nextUrl.pathname.startsWith("/result-entry")
  
  // Handle supervisor routes separately (they have their own authentication)
  if (isSupervisorRoute) {
    return NextResponse.next()
  }
  
  // Handle result entry routes separately (they have their own authentication)
  if (isResultEntryRoute) {
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
