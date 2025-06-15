import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { facilitators } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  const session = await getSession()
  
  if (!session || !["coordinator", "admin"].includes(session.role)) {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  const { searchParams } = new URL(request.url)
  const chapterId = searchParams.get("chapterId")
  
  try {
    const db = getDbConnection()
    
    let result
    
    // For coordinators, only show their chapter's facilitators
    if (session.role === "coordinator") {
      if (!session.chapterId) {
        return new NextResponse(JSON.stringify({
          error: "Coordinator must have a chapter ID"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      result = await db.select().from(facilitators)
        .where(eq(facilitators.chapterId, session.chapterId))
        .execute()
    } else if (chapterId && session.role === "admin") {
      result = await db.select().from(facilitators)
        .where(eq(facilitators.chapterId, parseInt(chapterId)))
        .execute()
    } else {
      result = await db.select().from(facilitators).execute()
    }
    
    return NextResponse.json({ facilitators: result })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch facilitators"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const body = await request.json()
    const { name, phoneNumber, position } = body
      if (!name || !phoneNumber || !position || !session.chapterId) {
      return new NextResponse(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (![1, 2].includes(position)) {
      return new NextResponse(JSON.stringify({
        error: "Position must be 1 or 2"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const db = getDbConnection()
    
    // Check if position is already taken for this chapter
    const existing = await db.select()
      .from(facilitators)
      .where(and(
        eq(facilitators.chapterId, session.chapterId),
        eq(facilitators.position, position),
        eq(facilitators.isActive, true)
      ))
      .execute()
    
    if (existing.length > 0) {
      return new NextResponse(JSON.stringify({
        error: `Position ${position} is already filled for this chapter`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    const result = await db.insert(facilitators).values({
      chapterId: session.chapterId,
      name,
      phoneNumber,
      position,
      isActive: true
    }).returning().execute()
    
    return NextResponse.json({ facilitator: result[0] })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to create facilitator"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

export async function PUT(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  if (!session.chapterId) {
    return new NextResponse(JSON.stringify({
      error: "Coordinator must have a chapter ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const body = await request.json()
    const { id, name, phoneNumber } = body
    
    if (!id || !name || !phoneNumber) {
      return new NextResponse(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const db = getDbConnection()
    
    const result = await db.update(facilitators)
      .set({ 
        name, 
        phoneNumber,
        updatedAt: new Date()
      })
      .where(and(
        eq(facilitators.id, id),
        eq(facilitators.chapterId, session.chapterId)
      ))
      .returning()
      .execute()
    
    if (result.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "Facilitator not found or not authorized"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    return NextResponse.json({ facilitator: result[0] })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to update facilitator"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

export async function DELETE(request: Request) {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    return new NextResponse(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })
  }

  if (!session.chapterId) {
    return new NextResponse(JSON.stringify({
      error: "Coordinator must have a chapter ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  
  if (!id) {
    return new NextResponse(JSON.stringify({
      error: "Missing facilitator ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const db = getDbConnection()
    
    const result = await db.update(facilitators)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(facilitators.id, parseInt(id)),
        eq(facilitators.chapterId, session.chapterId)
      ))
      .returning()
      .execute()
    
    if (result.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "Facilitator not found or not authorized"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to delete facilitator"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
