import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"

export async function GET() {
  try {
    // Get database connection
    const db = getDbConnection()
    
    // Test query to see if administrators table exists
    const result = await db.execute('SELECT COUNT(*) FROM administrators')
    
    // Return success with count
    return NextResponse.json({ 
      success: true,
      count: result.rows[0].count,
      message: 'Database connection successful'
    })
  } catch (error) {
    console.error("Database test failed:", error)
    
    // Return detailed error for debugging
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 })
  }
}
