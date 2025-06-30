import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Create CSV template content
    const csvHeaders = [
      "first_name",
      "middle_name", 
      "last_name",
      "school_name",
      "parent_first_name",
      "parent_last_name",
      "parent_phone",
      "parent_email",
      "parent_consent"
    ]

    const csvTemplate = [
      csvHeaders.join(","),
      "John,Michael,Doe,ABC Secondary School,Jane,Doe,08012345678,jane.doe@email.com,true",
      "Mary,Grace,Smith,XYZ High School,Robert,Smith,08098765432,robert.smith@email.com,true"
    ].join("\n")

    return new NextResponse(csvTemplate, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="registration-import-template.csv"'
      }
    })

  } catch (error) {
    console.error("Error generating template:", error)
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}
