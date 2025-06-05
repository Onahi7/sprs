import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/db"
import { 
  chapters, 
  schools, 
  centers, 
  registrations, 
  chapterCoordinators 
} from "@/db/schema"
import { getDbConnection } from "@/db/utils"
import fs from "fs"
import path from "path"
import os from "os"
import { v4 as uuidv4 } from "uuid"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

// Parse SQL INSERT statements and extract values
const extractInsertData = (sqlStatement: string, table: string) => {
  try {
    // Remove MySQL specific syntax and comments
    const cleanedSQL = sqlStatement
      .replace(/ENGINE=\w+/g, '')
      .replace(/DEFAULT CHARSET=\w+/g, '')
      .replace(/COLLATE=\w+/g, '')
      .replace(/AUTO_INCREMENT=\d+/g, '')
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')

    // Extract INSERT statements for the specified table
    const regex = new RegExp(`INSERT\\s+INTO\\s+\`?${table}\`?\\s*\\([\\s\\S]*?\\)\\s*VALUES\\s*([\\s\\S]*?);`, 'gi')
    const insertMatches = [...cleanedSQL.matchAll(regex)]
    
    if (!insertMatches.length) {
      return []
    }

    // Get column names from the first INSERT statement
    const columnRegex = new RegExp(`INSERT\\s+INTO\\s+\`?${table}\`?\\s*\\(([\\s\\S]*?)\\)\\s*VALUES`, 'i')
    const columnMatch = columnRegex.exec(insertMatches[0][0])
    
    if (!columnMatch) {
      return []
    }
    
    const columns = columnMatch[1]
      .split(',')
      .map(col => col.trim().replace(/`/g, '').replace(/"/g, '').replace(/'/g, ''))

    // Extract all value sets
    const records = []
    
    for (const insertMatch of insertMatches) {
      const valuesText = insertMatch[1]
      // Match value groups considering nested parentheses
      const valueRegex = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g
      const valueMatches = [...valuesText.matchAll(valueRegex)]
      
      for (const valueMatch of valueMatches) {
        const values = valueMatch[1].split(',').map(val => {
          val = val.trim()
          // Handle NULL values
          if (val.toUpperCase() === 'NULL') {
            return null
          }
          // Handle quoted strings
          if ((val.startsWith("'") && val.endsWith("'")) || 
              (val.startsWith('"') && val.endsWith('"'))) {
            return val.substring(1, val.length - 1)
          }
          // Handle numbers
          return isNaN(Number(val)) ? val : Number(val)
        })
        
    // Create record object with column names as keys
        const record: Record<string, any> = {}
        columns.forEach((col, idx) => {
          record[col] = values[idx] !== undefined ? values[idx] : null
        })
        
        records.push(record)
      }
    }
    
    return records  } catch (err) {
    const error = err as Error
    console.error("SQL parsing error:", error)
    return []
  }
}

// Function to map MySQL data to Postgres format
const mapRegistrationData = (record: any) => {
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
  }
}

const mapChapterData = (record: any) => {
  return {
    id: record.id,
    name: record.name,
    splitCode: record.split_code || null,
    amount: record.amount || "3000.00",
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  }
}

const mapSchoolData = (record: any) => {
  return {
    id: record.id,
    name: record.name,
    chapterId: record.chapter_id,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  }
}

const mapCenterData = (record: any) => {
  return {
    id: record.id,
    name: record.name,
    chapterId: record.chapter_id,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  }
}

const mapCoordinatorData = (record: any) => {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    chapterId: record.chapter_id,
    uniqueCode: record.unique_code,
    createdAt: record.created_at ? new Date(record.created_at) : new Date(),
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check auth status
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const sqlFile = formData.get("sqlFile") as File
    const tableType = formData.get("tableType") as string
    
    if (!sqlFile || !tableType) {
      return NextResponse.json(
        { error: "SQL file and table type are required" }, 
        { status: 400 }
      )
    }

    // Read the SQL file
    const sqlContent = await sqlFile.text()
    
    // Get DB connection
    const dbConnection = getDbConnection()
    
    let importedCount = 0
    let tableName = ""
    let mappedData = []
    
    // Choose the appropriate table and mapping function
    switch (tableType) {
      case "registrations":
        tableName = "registrations"
        mappedData = extractInsertData(sqlContent, tableName).map(mapRegistrationData)
        for (const record of mappedData) {
          await dbConnection.insert(registrations).values(record).onConflictDoNothing()
          importedCount++
        }
        break
        
      case "chapters":
        tableName = "chapters"
        mappedData = extractInsertData(sqlContent, tableName).map(mapChapterData)
        for (const record of mappedData) {
          await dbConnection.insert(chapters).values(record).onConflictDoNothing()
          importedCount++
        }
        break
        
      case "schools":
        tableName = "schools"
        mappedData = extractInsertData(sqlContent, tableName).map(mapSchoolData)
        for (const record of mappedData) {
          await dbConnection.insert(schools).values(record).onConflictDoNothing()
          importedCount++
        }
        break
        
      case "centers":
        tableName = "centers"
        mappedData = extractInsertData(sqlContent, tableName).map(mapCenterData)
        for (const record of mappedData) {
          await dbConnection.insert(centers).values(record).onConflictDoNothing()
          importedCount++
        }
        break
        
      case "coordinators":
        tableName = "chapter_coordinators"
        mappedData = extractInsertData(sqlContent, tableName).map(mapCoordinatorData)
        for (const record of mappedData) {
          await dbConnection.insert(chapterCoordinators).values(record).onConflictDoNothing()
          importedCount++
        }
        break
        
      default:
        return NextResponse.json(
          { error: "Invalid table type specified" }, 
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} records to ${tableType}`,
      count: importedCount
    })
      } catch (err) {
    const error = err as Error
    console.error("SQL import error:", error)
    return NextResponse.json(
      { error: `Failed to import SQL data: ${error.message}` }, 
      { status: 500 }
    )
  }
}
