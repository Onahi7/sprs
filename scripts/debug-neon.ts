#!/usr/bin/env node
/**
 * Neon DB Debug Script
 * 
 * This script tests the connection to Neon DB and attempts to insert a simple record
 * Run with: npx ts-node scripts/debug-neon.ts
 */

import { getDbConnection } from "@/db/utils";
import { chapters } from "@/db/schema";
import { sql } from "drizzle-orm";

async function testNeonDbConnection() {
  console.log("Testing connection to Neon DB...");
  
  try {
    const dbConnection = getDbConnection();
    
    // Test 1: Simple query to check connection
    console.log("\nTest 1: Running simple query...");
    const testQuery = await dbConnection.execute(sql`SELECT 1 as test`);
    console.log("Query result:", testQuery);
    
    // Test 2: Count number of records in chapters table
    console.log("\nTest 2: Counting chapters records...");
    const chapterCount = await dbConnection.select({ count: sql`count(*)` }).from(chapters);
    console.log("Current chapters count:", chapterCount[0].count);
    
    // Test 3: Insert a test chapter to verify write access
    const testChapter = {
      name: `Test Chapter ${Math.floor(Math.random() * 10000)}`,
      amount: "3000.00",
      createdAt: new Date(),
    };
    
    console.log("\nTest 3: Inserting test chapter...");
    const insertResult = await dbConnection
      .insert(chapters)
      .values(testChapter)
      .returning();
    
    console.log("Insert result:", insertResult);
    
    // Test 4: Count chapters again to verify insertion
    console.log("\nTest 4: Counting chapters after insertion...");
    const newChapterCount = await dbConnection.select({ count: sql`count(*)` }).from(chapters);
    console.log("New chapters count:", newChapterCount[0].count);
    
    console.log("\n✅ All tests completed. Database connection working correctly.");
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
  }
}

// Run the test
testNeonDbConnection();
