// This script demonstrates how to update the auth system to use the administrators table
// To use this example, you would need to modify your existing auth system

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDbConnection } from "@/db/utils";
import { createAuthToken } from "@/lib/auth";
import bcrypt from "bcrypt";

// Define the administrators table schema
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Define the administrators table if not already defined in your schema
export const administrators = pgTable("administrators", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Example of a modified login function to use administrators table
export async function adminLogin(username: string, password: string) {
  try {
    // Get DB connection
    const db = await getDbConnection();
    
    // Find admin user
    const admin = await db.query.administrators.findFirst({
      where: eq(administrators.username, username),
    });
    
    if (!admin) {
      return { success: false, message: "Invalid credentials" };
    }
    
    // Check if admin is active
    if (!admin.isActive) {
      return { success: false, message: "Account is inactive" };
    }
    
    // Verify password with bcrypt
    const passwordMatch = await bcrypt.compare(password, admin.password);
    
    if (!passwordMatch) {
      return { success: false, message: "Invalid credentials" };
    }
    
    // Create session
    const session = {
      id: admin.id,
      username: admin.username,
      role: "admin" as const,
    };
    
    // Create token
    const token = createAuthToken(session);
    
    return { success: true, token };
  } catch (error) {
    console.error("Error logging in admin:", error);
    return { success: false, message: "Login failed" };
  }
}

// Example of updating the POST handler in app/api/admin/login/route.ts
export async function updatedPOST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Use the new adminLogin function
    const result = await adminLogin(username, password);
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }

    // Set the token in a cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error logging in admin:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
