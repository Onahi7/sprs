import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

// Check if we're running on the client side
const isClient = typeof window !== 'undefined'

// Only attempt to use the database connection on the server
let db: ReturnType<typeof createDrizzleInstance> | null = null

function createDrizzleInstance() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
  }

  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

// Only initialize the database connection on the server side
if (!isClient) {
  try {
    db = createDrizzleInstance()
  } catch (error) {
    console.error("Failed to initialize database connection:", error)
    // We'll let the db remain null and handle it in the API routes
  }
}

// Helper function to get the db connection or throw an appropriate error
export function getDbConnection() {
  if (!db) {
    throw new Error("Database connection not available")
  }
  return db
}

export { db }

// Export coordinator slots utilities
export * from './coordinator-slots-utils'
