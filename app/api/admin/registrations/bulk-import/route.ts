import { NextResponse } from "next/server"
import { getDbConnection } from "@/db/utils"
import { getSession } from "@/lib/auth"
import { registrations, chapters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const chapterId = formData.get('chapterId') as string

    if (!file || !chapterId) {
      return NextResponse.json({ error: "File and chapter ID are required" }, { status: 400 })
    }

    // Validate chapter exists
    const db = getDbConnection()
    const chapter = await db.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(chapterId))
    })

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // Parse CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must contain headers and at least one data row" }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const dataLines = lines.slice(1)

    // Validate required columns
    const requiredColumns = ['first_name', 'last_name', 'parent_first_name', 'parent_last_name', 'parent_phone', 'parent_email']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 })
    }

    let successful = 0
    let failed = 0
    const errors: Array<{ row: number; error: string }> = []

    // Process each row
    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2 // Account for header row
      const values = dataLines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      
      try {
        // Map values to object
        const rowData: any = {}
        headers.forEach((header, index) => {
          rowData[header] = values[index] || ''
        })

        // Validate required fields
        if (!rowData.first_name || !rowData.last_name) {
          errors.push({ row: rowNum, error: "First name and last name are required" })
          failed++
          continue
        }

        if (!rowData.parent_email || !rowData.parent_email.includes('@')) {
          errors.push({ row: rowNum, error: "Valid parent email is required" })
          failed++
          continue
        }

        // Generate registration number
        const timestamp = Date.now()
        const registrationNumber = `REG-${chapter.name.toUpperCase().replace(/\s+/g, '')}-${timestamp}-${i + 1}`

        // Create registration
        await db.insert(registrations).values({
          registrationNumber,
          firstName: rowData.first_name,
          middleName: rowData.middle_name || null,
          lastName: rowData.last_name,
          chapterId: parseInt(chapterId),
          schoolName: rowData.school_name || 'Imported School',
          parentFirstName: rowData.parent_first_name,
          parentLastName: rowData.parent_last_name,
          parentPhone: rowData.parent_phone,
          parentEmail: rowData.parent_email,
          parentConsent: rowData.parent_consent === 'true' || rowData.parent_consent === '1',
          passportUrl: '/placeholder-user.jpg', // Default placeholder
          paymentStatus: 'pending',
          registrationType: 'coordinator',
          createdAt: new Date()
        })

        successful++
      } catch (error) {
        console.error(`Error processing row ${rowNum}:`, error)
        errors.push({ row: rowNum, error: "Failed to create registration" })
        failed++
      }
    }

    return NextResponse.json({
      successful,
      failed,
      errors: errors.slice(0, 50) // Limit error list to prevent large responses
    })

  } catch (error) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    )
  }
}
