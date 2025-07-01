import { NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"
import * as jose from 'jose'
import { cookies } from "next/headers"
import * as bcrypt from 'bcryptjs'
import { administrators } from "@/db/schema"

export async function POST(request: Request) {
  console.log("Admin login API: Request received")
  try {
    const { username, password } = await request.json()
    console.log("Admin login API: Login attempt for user:", username)

    if (!username || !password) {
      console.log("Admin login API: Missing username or password")
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }
    
    // Connect to the database
    console.log("Admin login API: Connecting to database")
    const db = getDbConnection();
    
    console.log("Admin login API: Executing SQL to find admin user")
    const result = await db.execute(
      sql`SELECT * FROM administrators WHERE username = ${username} LIMIT 1`
    );
    
    const admin = result.rows[0];
    console.log("Admin login API: Admin found?", !!admin);
    
    // Check if admin exists
    if (!admin) {
      console.log(`Admin login failed: Admin not found for username: ${username}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    
    // Check if admin is active
    if (admin.is_active === false) {
      console.log("Admin login failed: Account is inactive for username:", username);
      return NextResponse.json({ error: "Account is inactive" }, { status: 403 })
    }
    
    // Verify password with bcrypt
    const storedPassword = admin.password as string;
    if (!bcrypt.compareSync(password, storedPassword)) {
      console.log("Admin login failed: Password incorrect for username:", username);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
      console.log("Admin login API: Password verification successful, creating JWT token")
    // Create a JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
    console.log("Admin login API: Using JWT Secret:", jwtSecret.substring(0, 3) + "...")
    
    // Using jose library for Edge Runtime compatibility
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new jose.SignJWT({ 
        username, 
        role: "admin" 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);
    
    console.log("Admin login API: JWT token created successfully")
    
    // Set the token in a cookie
    const cookieStore = await cookies()
    const response = NextResponse.json({ 
      success: true,
      message: "Login successful" 
    });
    
    console.log("Admin login API: Setting auth_token cookie")
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/"
    });

    console.log("Admin login API: Login successful for:", username);
    
    return response;
    
  } catch (error) {
    console.error("Error logging in admin:", error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json({ 
        error: "Database connection failed",
        details: error.message
      }, { status: 500 })
    }
    
    // Generic error response
    return NextResponse.json({ 
      error: "Failed to log in",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
