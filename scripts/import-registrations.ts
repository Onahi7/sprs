import { registrations, chapters, schools, centers, chapterCoordinators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDbConnection } from "@/db/utils";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'your_old_database'
};

// Map functions for different record types
function mapRegistrationData(record: any) {
  return {
    id: record.id,
    registrationNumber: record.registration_number,
    firstName: record.first_name,
    middleName: record.middle_name || null,
    lastName: record.last_name,
    chapterId: record.chapter_id,
    schoolId: record.school_id,
    schoolName: record.school_name || null,
    centerId: record.center_id,
    parentFirstName: record.parent_first_name,
    parentLastName: record.parent_last_name,
    parentPhone: record.parent_phone,
    parentEmail: record.parent_email,
    parentConsent: record.parent_consent ? true : false,
    passportUrl: record.passport_url,
    paymentStatus: record.payment_status || "pending",
    paymentReference: record.payment_reference || null,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  };
}

function mapChapterData(record: any) {
  return {
    id: record.id,
    name: record.name,
    splitCode: record.split_code || null,
    amount: record.amount || "3000.00",
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  };
}

function mapSchoolData(record: any) {
  return {
    id: record.id,
    name: record.name,
    chapterId: record.chapter_id,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  };
}

function mapCenterData(record: any) {
  return {
    id: record.id,
    name: record.name,
    chapterId: record.chapter_id,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  };
}

function mapCoordinatorData(record: any) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    chapterId: record.chapter_id,
    uniqueCode: record.unique_code,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  };
}

// Extract INSERT data from SQL file
function extractInsertData(sqlContent: string, tableName: string): any[] {
  try {
    // Remove MySQL specific syntax and comments
    const cleanedSQL = sqlContent
      .replace(/ENGINE=\w+/g, '')
      .replace(/DEFAULT CHARSET=\w+/g, '')
      .replace(/COLLATE=\w+/g, '')
      .replace(/AUTO_INCREMENT=\d+/g, '')
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    // Extract INSERT statements for the specified table
    const regex = new RegExp(`INSERT\\s+INTO\\s+\`?${tableName}\`?\\s*\\([\\s\\S]*?\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'gi');
    const insertMatches = Array.from(cleanedSQL.matchAll(regex));
    
    if (!insertMatches.length) {
      return [];
    }

    // Get column names from the first INSERT statement
    const columnRegex = new RegExp(`INSERT\\s+INTO\\s+\`?${tableName}\`?\\s*\\(([\\s\\S]*?)\\)\\s*VALUES`, 'i');
    const columnMatch = columnRegex.exec(insertMatches[0][0]);
    
    if (!columnMatch) {
      return [];
    }
    
    const columns = columnMatch[1]
      .split(',')
      .map(col => col.trim().replace(/`/g, '').replace(/"/g, '').replace(/'/g, ''));

    // Extract all value sets
    const records: any[] = [];
    
    for (const insertMatch of insertMatches) {
      const valuesText = insertMatch[1];
      // Match value groups considering nested parentheses
      const valueRegex = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
      const valueMatches = Array.from(valuesText.matchAll(valueRegex));
      
      for (const valueMatch of valueMatches) {
        const values = valueMatch[1].split(',').map(val => {
          val = val.trim();
          // Handle NULL values
          if (val.toUpperCase() === 'NULL') {
            return null;
          }
          // Handle quoted strings
          if ((val.startsWith("'") && val.endsWith("'")) || 
              (val.startsWith('"') && val.endsWith('"'))) {
            return val.substring(1, val.length - 1);
          }
          // Handle numbers
          return isNaN(Number(val)) ? val : Number(val);
        });
        
        // Create record object with column names as keys
        const record: Record<string, any> = {};
        columns.forEach((col, idx) => {
          record[col] = values[idx] !== undefined ? values[idx] : null;
        });
        
        records.push(record);
      }
    }
    
    return records;
  } catch (err) {
    console.error("SQL parsing error:", err);
    return [];
  }
}

// Function to import data from SQL file
async function importFromSqlFile(filePath: string, tableType: string): Promise<{success: boolean, count?: number, error?: string}> {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return { success: false, error: 'File not found' };
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`SQL file size: ${sqlContent.length} bytes`);

    // Extract INSERT statements for the specified table
    let tableName: string;
    switch (tableType) {
      case 'registrations': tableName = 'registrations'; break;
      case 'chapters': tableName = 'chapters'; break;
      case 'schools': tableName = 'schools'; break;
      case 'centers': tableName = 'centers'; break;
      case 'coordinators': tableName = 'chapter_coordinators'; break;
      default: 
        console.error(`Unknown table type: ${tableType}`);
        return { success: false, error: 'Unknown table type' };
    }

    console.log(`Extracting data for table: ${tableName}`);
    const records = extractInsertData(sqlContent, tableName);
    
    if (records.length === 0) {
      console.log(`No ${tableName} data found in SQL file`);
      return { success: false, error: 'No data found' };
    }

    console.log(`Found ${records.length} records in SQL file`);
    
    // Verify database connection
    console.log("Testing database connection...");
    const dbConnection = getDbConnection();
    try {
      // Verify connection with a simple query
      const connectionTest = await dbConnection.execute(sql`SELECT 1 as connection_test`);
      console.log("Connection test result:", connectionTest);
    } catch (connErr) {
      console.error("Database connection error:", connErr);
      return { success: false, error: 'Database connection failed' };
    }
    
    // Import based on table type
    let importedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        let result;
        
        switch (tableType) {
          case 'registrations':
            const regData = mapRegistrationData(record);
            result = await dbConnection.insert(registrations).values(regData).returning();
            console.log(`Inserted registration #${i+1}/${records.length}, ID: ${result[0]?.id || 'unknown'}`);
            break;
          case 'chapters':
            const chapterData = mapChapterData(record);
            result = await dbConnection.insert(chapters).values(chapterData).returning();
            console.log(`Inserted chapter #${i+1}/${records.length}, ID: ${result[0]?.id || 'unknown'}`);
            break;
          case 'schools':
            const schoolData = mapSchoolData(record);
            result = await dbConnection.insert(schools).values(schoolData).returning();
            console.log(`Inserted school #${i+1}/${records.length}, ID: ${result[0]?.id || 'unknown'}`);
            break;
          case 'centers':
            const centerData = mapCenterData(record);
            result = await dbConnection.insert(centers).values(centerData).returning();
            console.log(`Inserted center #${i+1}/${records.length}, ID: ${result[0]?.id || 'unknown'}`);
            break;
          case 'coordinators':
            const coordData = mapCoordinatorData(record);
            result = await dbConnection.insert(chapterCoordinators).values(coordData).returning();
            console.log(`Inserted coordinator #${i+1}/${records.length}, ID: ${result[0]?.id || 'unknown'}`);
            break;
        }
        importedCount++;
        
        // Show progress every 10 records
        if (importedCount % 10 === 0 && records.length > 10) {
          console.log(`Progress: ${importedCount}/${records.length} records imported (${Math.round(importedCount/records.length*100)}%)`);
        }
      } catch (err) {
        errorCount++;
        console.error(`Error importing record #${i+1}:`, err);
        
        // If we have too many errors, abort
        if (errorCount > 10) {
          console.error("Too many errors, aborting import");
          return { 
            success: false, 
            count: importedCount, 
            error: `Import aborted after ${errorCount} errors. ${importedCount} records were successfully imported.` 
          };
        }
      }
    }

    // Verify import by counting records
    let countResult;
    switch (tableType) {
      case 'registrations':
        countResult = await dbConnection.select({ count: sql`count(*)` }).from(registrations);
        break;
      case 'chapters':
        countResult = await dbConnection.select({ count: sql`count(*)` }).from(chapters);
        break;
      case 'schools':
        countResult = await dbConnection.select({ count: sql`count(*)` }).from(schools);
        break;
      case 'centers':
        countResult = await dbConnection.select({ count: sql`count(*)` }).from(centers);
        break;
      case 'coordinators':
        countResult = await dbConnection.select({ count: sql`count(*)` }).from(chapterCoordinators);
        break;
    }
    
    console.log(`Current ${tableType} count in database: ${countResult?.[0]?.count || 'unknown'}`);
    console.log(`Successfully imported ${importedCount} records with ${errorCount} errors`);
    return { success: true, count: importedCount };
  } catch (err) {
    const error = err as Error;
    console.error("Error importing from SQL file:", error);
    return { success: false, error: error.message };
  }
}

// Function to generate unique registration numbers if needed
function generateRegistrationNumber(chapterCode: string, counter: number): string {
  const paddedCounter = counter.toString().padStart(4, '0');
  const year = new Date().getFullYear();
  return `${chapterCode}${year}${paddedCounter}`;
}

// Main migration function
async function migrateRegistrationsData() {
  // Initialize connections
  const mysqlConnection = await mysql.createConnection(mysqlConfig);
  const pgConnection = getDbConnection();
  
  console.log("Starting registrations data migration...");
  
  try {
    // Get all registrations from MySQL
    const [mysqlRegistrations] = await mysqlConnection.query(
      `SELECT * FROM registrations`
    );
    
    console.log(`Found ${(mysqlRegistrations as any[]).length} registrations to migrate`);
    
    // Counter for registration numbers if needed
    let counter = 1;
    
    // Process each registration record
    for (const record of mysqlRegistrations as any[]) {
      try {
        // Look up chapter, school, center references
        const chapterResult = await pgConnection.select().from(chapters)
          .where(eq(chapters.id, record.chapter_id));
        
        if (chapterResult.length === 0) {
          console.error(`Chapter not found for ID: ${record.chapter_id}`);
          continue;
        }
        
        const schoolResult = await pgConnection.select().from(schools)
          .where(eq(schools.id, record.school_id));
        
        if (schoolResult.length === 0) {
          console.error(`School not found for ID: ${record.school_id}`);
          continue;
        }
        
        const centerResult = await pgConnection.select().from(centers)
          .where(eq(centers.id, record.center_id));
        
        if (centerResult.length === 0) {
          console.error(`Center not found for ID: ${record.center_id}`);
          continue;
        }
        
        // Generate or use existing registration number
        const registrationNumber = record.registration_number || 
          generateRegistrationNumber(chapterResult[0].splitCode || 'REG', counter++);
        
        // Convert payment status to appropriate enum value
        const paymentStatus = record.payment_status === 'completed' ? 'completed' : 'pending';
        
        // Convert MySQL tinyint(1) to boolean for parent_consent
        const parentConsent = record.parent_consent === 1;
        
        // Insert the registration into PostgreSQL
        await pgConnection.insert(registrations).values({
          registrationNumber: registrationNumber,
          firstName: record.first_name,
          middleName: record.middle_name || null,
          lastName: record.last_name,
          chapterId: record.chapter_id,
          schoolId: record.school_id,
          schoolName: record.school_name || schoolResult[0].name,
          centerId: record.center_id,
          parentFirstName: record.parent_first_name,
          parentLastName: record.parent_last_name,
          parentPhone: record.parent_phone,
          parentEmail: record.parent_email,
          parentConsent: parentConsent,
          passportUrl: record.passport_url,
          paymentStatus: paymentStatus,
          paymentReference: record.payment_reference || null,
          // Convert MySQL datetime to PostgreSQL timestamp if needed
          createdAt: record.created_at ? new Date(record.created_at) : new Date()
        });
        
        console.log(`Migrated registration: ${registrationNumber} - ${record.first_name} ${record.last_name}`);
      } catch (error) {
        console.error(`Error migrating registration with ID ${record.id}:`, error);
      }
    }
    
    console.log("Registration data migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    // Close MySQL connection
    await mysqlConnection.end();
  }
}

// Main function to handle different import methods
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
Usage: ts-node import-registrations.ts [command] [options]

Commands:
  mysql:registrations   Import registrations directly from MySQL database
  mysql:chapters        Import chapters directly from MySQL database
  mysql:schools         Import schools directly from MySQL database
  mysql:centers         Import centers directly from MySQL database
  mysql:all             Import all data directly from MySQL database
  
  sql:registrations [file]    Import registrations from SQL file
  sql:chapters [file]         Import chapters from SQL file  
  sql:schools [file]          Import schools from SQL file
  sql:centers [file]          Import centers from SQL file
  sql:coordinators [file]     Import coordinators from SQL file
    `);
    process.exit(1);
  }
  
  // Check for required environment variables based on import type
  if (command.startsWith('mysql:')) {
    if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || 
        !process.env.MYSQL_PASSWORD || !process.env.MYSQL_DATABASE) {
      console.error("Missing MySQL connection details in environment variables.");
      console.error("Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.");
      process.exit(1);
    }
  }
  
  // Handle different commands
  if (command === 'mysql:registrations') {
    await migrateRegistrationsData();
  } 
  else if (command === 'mysql:chapters') {
    // Add implementation for chapters import from MySQL
    console.log("Chapters import from MySQL not implemented yet");
  }
  else if (command === 'mysql:schools') {
    // Add implementation for schools import from MySQL
    console.log("Schools import from MySQL not implemented yet");
  }
  else if (command === 'mysql:centers') {
    // Add implementation for centers import from MySQL
    console.log("Centers import from MySQL not implemented yet");
  }
  else if (command === 'mysql:all') {
    // Import all data in the correct order
    console.log("=== Importing chapters from MySQL ===");
    // Add implementation
    console.log("\n=== Importing schools from MySQL ===");
    // Add implementation
    console.log("\n=== Importing centers from MySQL ===");
    // Add implementation
    console.log("\n=== Importing registrations from MySQL ===");
    await migrateRegistrationsData();
  }
  else if (command.startsWith('sql:')) {
    const importType = command.split(':')[1];
    const sqlFilePath = args[1];
    
    if (!sqlFilePath) {
      console.error(`SQL file path is required for ${command}`);
      process.exit(1);
    }
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    console.log(`Importing ${importType} from SQL file: ${sqlFilePath}`);
    const result = await importFromSqlFile(sqlFilePath, importType);
    
    if (result.success) {
      console.log(`Successfully imported ${result.count} ${importType} records`);
    } else {
      console.error(`Import failed: ${result.error}`);
      process.exit(1);
    }
  }
  else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
  
  console.log("Import process completed!");
}

// Run the main function when the script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("Process finished!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Process failed:", err);
      process.exit(1);
    });
}
