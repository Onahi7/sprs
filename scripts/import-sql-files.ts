#!/usr/bin/env node
/**
 * Import SQL Files - Batch Processing Script
 * 
 * This script allows importing multiple SQL files in the correct order
 * Usage: npx ts-node import-sql-files.ts <folder-path>
 * 
 * The folder should contain SQL files with names matching:
 * - chapters.sql
 * - schools.sql
 * - centers.sql
 * - coordinators.sql
 * - registrations.sql
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Client } from 'pg';

// Get folder path from command line args
const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Please provide a folder path containing SQL files');
  console.error('Usage: npx ts-node import-sql-files.ts <folder-path>');
  process.exit(1);
}

// Check if folder exists
if (!fs.existsSync(folderPath)) {
  console.error(`Folder not found: ${folderPath}`);
  process.exit(1);
}

// Define import order
const importOrder = [
  { name: 'chapters', file: 'chapters.sql' },
  { name: 'schools', file: 'schools.sql' }, 
  { name: 'centers', file: 'centers.sql' },
  { name: 'coordinators', file: 'coordinators.sql' },
  { name: 'registrations', file: 'registrations.sql' }
];

// Check which files exist
const existingFiles = importOrder.filter(item => 
  fs.existsSync(path.join(folderPath, item.file))
);

if (existingFiles.length === 0) {
  console.error('No SQL files found in the specified folder.');
  console.error('Required file names: chapters.sql, schools.sql, centers.sql, coordinators.sql, registrations.sql');
  process.exit(1);
}

console.log('Found the following SQL files:');
existingFiles.forEach(file => {
  console.log(`- ${file.file}`);
});

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\nImport these files in the recommended order? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
    console.log('Import canceled.');
    rl.close();
    process.exit(0);
  }
  
  rl.close();
  console.log('\nStarting SQL import process...');
  // Neon DB connection configuration
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  (async () => {
    try {
      // Connect to the Neon database
      await client.connect();
      console.log('Connected to Neon database.');

      // Import files in correct order
      for (const fileInfo of existingFiles) {
        const filePath = path.join(folderPath, fileInfo.file);
        console.log(`\n=== Importing ${fileInfo.name} from ${fileInfo.file} ===`);

        try {
          const sqlContent = fs.readFileSync(filePath, 'utf-8');
          await client.query(sqlContent);
          console.log(`✅ Successfully imported ${fileInfo.name}`);
        } catch (error: any) {
          console.error(`❌ Error importing ${fileInfo.name}: ${error.message}`);

          // Ask if we should continue despite the error
          const continueResponse = execSync('powershell -Command Read-Host -Prompt "Continue with next file? (yes/no)"', {
            encoding: 'utf-8',
          }).trim();

          if (continueResponse.toLowerCase() !== 'yes' && continueResponse.toLowerCase() !== 'y') {
            console.log('Import process stopped.');
            process.exit(1);
          }
        }
      }

      console.log('\n=== Import process complete ===');
    } catch (err: any) {
      console.error('Failed to connect to Neon database:', err.message);
    } finally {
      // Close the database connection
      await client.end();
      console.log('Disconnected from Neon database.');
    }
  })();
});
