// Import the administrators table
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const adminSqlFile = path.resolve(process.cwd(), 'administrators.sql');

// Check if the file exists
if (!fs.existsSync(adminSqlFile)) {
  console.error(`File not found: ${adminSqlFile}`);
  process.exit(1);
}

// Read the SQL file
const sql = fs.readFileSync(adminSqlFile, 'utf-8');

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Use neon-postgres CLI if available, otherwise fall back to psql
console.log('Importing administrators table...');
try {
  // Execute the SQL directly using the database client
  const { Client } = require('pg');
  const client = new Client({ connectionString: databaseUrl });
  
  client.connect()
    .then(() => {
      return client.query(sql);
    })
    .then(() => {
      console.log('✅ Administrators table import completed successfully');
      client.end();
    })
    .catch(err => {
      console.error('❌ Error executing SQL:', err);
      client.end();
      process.exit(1);
    });
} catch (error) {
  console.error('Failed to import SQL:', error);
  process.exit(1);
}
