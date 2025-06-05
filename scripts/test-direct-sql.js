// Test SQL import directly
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Need to use dynamic import for ESM modules in CommonJS
async function runTest() {
  // Load environment variables
  dotenv.config({ path: '.env.local' });
  
  try {
    // Import ESM modules dynamically
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    const { sql } = await import('drizzle-orm');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Simple test SQL content
const testSql = `
INSERT INTO chapters (id, name, split_code, amount) VALUES
('test-1', 'Test Chapter 1', 'TC1', '2500.00'),
('test-2', 'Test Chapter 2', 'TC2', '3500.00');
`;

async function testSqlImport() {
  console.log("Starting direct SQL import test...");

  try {
    // Write test SQL to temp file
    const tempFile = './temp-test.sql';
    fs.writeFileSync(tempFile, testSql);
    console.log("Created test SQL file:", tempFile);
    
    // Connect to database directly
    console.log("Connecting to database...");
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }
    
    console.log("Connection string exists, connecting to database...");
    const sql_connection = neon(connectionString);
    const db = drizzle(sql_connection);
    
    // Check connection works
    const connTest = await db.execute(sql`SELECT 1 as test`);
    console.log("Connection test:", connTest);
    
    // Count chapters before import
    const beforeCount = await db.execute(sql`SELECT COUNT(*) as count FROM chapters`);
    console.log("Chapters before import:", beforeCount[0].count);
    
    // Execute the SQL directly
    console.log("Executing SQL directly...");
    await db.execute(sql.raw(testSql));
    
    // Count chapters after import
    const afterCount = await db.execute(sql`SELECT COUNT(*) as count FROM chapters`);
    console.log("Chapters after import:", afterCount[0].count);
    
    // Clean up test records
    console.log("Cleaning up test records...");
    await db.execute(sql`DELETE FROM chapters WHERE id IN ('test-1', 'test-2')`);
    
    // Final count
    const finalCount = await db.execute(sql`SELECT COUNT(*) as count FROM chapters`);
    console.log("Final chapters count:", finalCount[0].count);
    
    console.log("Direct SQL import test completed successfully!");
  } catch (error) {
    console.error("Error during direct SQL import test:", error);
  } finally {
    // Clean up temp file
    if (fs.existsSync('./temp-test.sql')) {
      fs.unlinkSync('./temp-test.sql');
    }
  }
}

testSqlImport().catch(console.error);
