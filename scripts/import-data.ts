import { chapters, schools, centers } from "@/db/schema"
import { eq } from "drizzle-orm"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { getDbConnection } from "@/db/utils"

// Function to import schools from CSV
async function importSchools(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" })
    const records = parse(fileContent, { columns: true, skip_empty_lines: true })
    const dbConnection = getDbConnection();
    
    console.log(`Importing ${records.length} schools...`)
    
    for (const record of records) {
      // Find the chapter by name
      const chapterResult = await dbConnection.select().from(chapters).where(eq(chapters.name, record.chapterName))
      
      if (chapterResult.length === 0) {
        console.error(`Chapter not found: ${record.chapterName}`)
        continue
      }
        const chapterId = chapterResult[0].id
      
      // Insert the school
      await dbConnection.insert(schools).values({
        name: record.schoolName,
        chapterId: chapterId
      })
      
      console.log(`Imported school: ${record.schoolName} (Chapter: ${record.chapterName})`)
    }
    
    console.log("School import completed")
  } catch (error) {
    console.error("Error importing schools:", error)
  }
}

// Function to import centers from CSV
async function importCenters(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" })
    const records = parse(fileContent, { columns: true, skip_empty_lines: true })
    const dbConnection = getDbConnection();
    
    console.log(`Importing ${records.length} centers...`)
    
    for (const record of records) {
      // Find the chapter by name
      const chapterResult = await dbConnection.select().from(chapters).where(eq(chapters.name, record.chapterName))
      
      if (chapterResult.length === 0) {
        console.error(`Chapter not found: ${record.chapterName}`)
        continue
      }
      
      const chapterId = chapterResult[0].id
        // Insert the center
      await dbConnection.insert(centers).values({
        name: record.centerName,
        chapterId: chapterId
      })
      
      console.log(`Imported center: ${record.centerName} (Chapter: ${record.chapterName})`)
    }
    
    console.log("Center import completed")
  } catch (error) {
    console.error("Error importing centers:", error)
  }
}

// Main function
async function main() {
  const command = process.argv[2]
  const filePath = process.argv[3]
  
  if (!command || !filePath) {
    console.log("Usage: ts-node import-data.ts [schools|centers] <csv-file-path>")
    process.exit(1)
  }
  
  if (command === "schools") {
    await importSchools(filePath)
  } else if (command === "centers") {
    await importCenters(filePath)
  } else {
    console.log("Invalid command. Use 'schools' or 'centers'")
    process.exit(1)
  }
}

main().catch(console.error)
