#!/usr/bin/env node
/**
 * MySQL to PostgreSQL SQL Converter
 * 
 * This script converts MySQL dump files to PostgreSQL compatible format
 * Usage: npx ts-node convert-mysql-to-postgres.ts <mysql-file> <table-name>
 */

import fs from 'fs';
import path from 'path';

const mysqlFile = process.argv[2];
const tableName = process.argv[3];

if (!mysqlFile || !tableName) {
  console.error('Usage: npx ts-node convert-mysql-to-postgres.ts <mysql-file> <table-name>');
  console.error('Example: npx ts-node convert-mysql-to-postgres.ts wp_sprs_chapters.sql chapters');
  process.exit(1);
}

if (!fs.existsSync(mysqlFile)) {
  console.error(`File not found: ${mysqlFile}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(mysqlFile, 'utf-8');
  
  // Extract INSERT statements
  const insertMatches = content.match(/INSERT INTO `[^`]+` \([^)]+\) VALUES[^;]+;/gi);
  
  if (!insertMatches) {
    console.error('No INSERT statements found in the file');
    process.exit(1);
  }
  
  // Convert MySQL INSERT to PostgreSQL format
  let postgresContent = `-- PostgreSQL compatible import for ${tableName}\n`;
  postgresContent += `-- Converted from MySQL dump: ${path.basename(mysqlFile)}\n\n`;
  
  insertMatches.forEach(insertStmt => {
    // Remove MySQL table name with backticks and replace with PostgreSQL table name
    const convertedStmt = insertStmt
      .replace(/INSERT INTO `[^`]+`/, `INSERT INTO ${tableName}`)
      .replace(/`/g, '') // Remove all backticks
      .replace(/\\'/g, "''"); // Convert MySQL escape quotes to PostgreSQL format
    
    postgresContent += convertedStmt + '\n';
  });
  
  // Add UPSERT capability and sequence update
  const lastInsertMatch = content.match(/AUTO_INCREMENT=(\d+)/);
  if (lastInsertMatch) {
    const nextId = parseInt(lastInsertMatch[1]);
    postgresContent += `\n-- Handle conflicts with UPSERT\n`;
    postgresContent = postgresContent.replace(
      /INSERT INTO/g, 
      'INSERT INTO'
    );
    
    // Add ON CONFLICT clause before the last semicolon
    postgresContent = postgresContent.replace(/;(\s*)$/m, `
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  split_code = EXCLUDED.split_code,
  amount = EXCLUDED.amount;

-- Update the sequence to the correct next value
SELECT setval('${tableName}_id_seq', ${nextId}, false);$1`);
  }
  
  // Write the converted file
  const outputFile = `${tableName}.sql`;
  fs.writeFileSync(outputFile, postgresContent);
  
  console.log(`✅ Converted ${mysqlFile} to ${outputFile}`);
  console.log(`📊 Found ${insertMatches.length} INSERT statements`);
  console.log(`🎯 Target table: ${tableName}`);
  
} catch (error) {
  console.error('Error converting file:', error.message);
  process.exit(1);
}
