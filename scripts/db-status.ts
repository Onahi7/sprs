#!/usr/bin/env node
/**
 * Neon DB Query Tool
 * 
 * This script allows querying the current database schema and table counts
 * Run with: npx ts-node scripts/db-status.ts
 */

import { getDbConnection } from "@/db/utils";
import { sql } from "drizzle-orm";

async function checkDatabaseStatus() {
  console.log("Connecting to Neon DB...");
  
  try {
    const db = getDbConnection();
    
    // Get a list of all tables
    console.log("\nQuerying database schema...");
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log("\nCurrent Database Tables:");
    console.table(tables);
    
    // Get count of records in each table
    console.log("\nCounting records in each table:");
    
    for (const row of tables) {
      const tableName = row.table_name;
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM ${sql.identifier(tableName)};
      `);
      
      console.log(`- ${tableName}: ${countResult[0].count} records`);
    }
    
    // Get database size information
    console.log("\nDatabase Size Information:");
    const dbSize = await db.execute(sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as db_size,
        pg_size_pretty(pg_total_relation_size('public.registrations')) as registrations_size
    `);
    
    console.table(dbSize);
    
    console.log("\n✅ Database status check completed.");
  } catch (error) {
    console.error("❌ Database check failed:", error);
  }
}

// Run the check
checkDatabaseStatus();
