import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Helper function to convert import statements
function updateDbImports(fileContent: string): string {
  // Replace the db import with the getDbConnection import
  let updatedContent = fileContent.replace(
    /import { db } from "@\/db"/,
    'import { getDbConnection } from "@/db/utils"'
  );
  
  // Replace direct db usage with getDbConnection()
  updatedContent = updatedContent.replace(
    /await db\./g,
    'await getDbConnection().'
  );
  
  updatedContent = updatedContent.replace(
    /const (.+?) = await db\./g,
    'const $1 = await getDbConnection().'
  );
  
  updatedContent = updatedContent.replace(
    /db\./g,
    'getDbConnection().'
  );
  
  return updatedContent;
}

// Main function to find and update API routes
async function main() {
  // Find all API route files
  const files = glob.sync('app/api/**/*.ts', { 
    cwd: process.cwd(),
    absolute: true
  });
  
  console.log(`Found ${files.length} API routes to check`);
  
  let updatedFilesCount = 0;
  
  // Process each file
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that don't import db
    if (!content.includes('import { db } from "@/db"')) {
      continue;
    }
    
    const updatedContent = updateDbImports(content);
    
    // Only write if content was changed
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      updatedFilesCount++;
      console.log(`Updated: ${filePath}`);
    }
  }
  
  console.log(`\nUpdated ${updatedFilesCount} API route files`);
}

main().catch(console.error);
