import { db } from "@/db"
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

/**
 * Utility function to get a database connection
 * Will use the existing db connection if available, otherwise creates a new one
 */
export function getDbConnection() {
  // If we already have a db connection, use it
  if (db) return db;
  
  // Otherwise, create a new connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }
  
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
