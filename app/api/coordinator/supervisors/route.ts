import { NextResponse } from "next/server"
import { getDbConnection } from "@/db"
import { supervisors, centers } from "@/db/schema"
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
    
    // For coordinators, only show their chapter's supervisors
    if (session.role === "coordinator") {
      if (!session.chapterId) {
        return new NextResponse(JSON.stringify({
          error: "Coordinator must have a chapter ID"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      result = await db.select({
        id: supervisors.id,
        chapterId: supervisors.chapterId,
        centerId: supervisors.centerId,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        isActive: supervisors.isActive,
        createdAt: supervisors.createdAt,
        updatedAt: supervisors.updatedAt,
        centerName: centers.name,
      }).from(supervisors)
        .leftJoin(centers, eq(supervisors.centerId, centers.id))
        .where(eq(supervisors.chapterId, session.chapterId))
        .execute()
    } else if (chapterId && session.role === "admin") {
      result = await db.select({
        id: supervisors.id,
        chapterId: supervisors.chapterId,
        centerId: supervisors.centerId,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        isActive: supervisors.isActive,
        createdAt: supervisors.createdAt,
        updatedAt: supervisors.updatedAt,
        centerName: centers.name,
      }).from(supervisors)
        .leftJoin(centers, eq(supervisors.centerId, centers.id))
        .where(eq(supervisors.chapterId, parseInt(chapterId)))
        .execute()
    } else {
      result = await db.select({
        id: supervisors.id,
        chapterId: supervisors.chapterId,
        centerId: supervisors.centerId,
        name: supervisors.name,
        phoneNumber: supervisors.phoneNumber,
        isActive: supervisors.isActive,
        createdAt: supervisors.createdAt,
        updatedAt: supervisors.updatedAt,
        centerName: centers.name,
      }).from(supervisors)
        .leftJoin(centers, eq(supervisors.centerId, centers.id))
        .execute()
    }
    
    return NextResponse.json({ supervisors: result })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to fetch supervisors"
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
    const { name, phoneNumber, centerId } = body
    
    if (!name || !phoneNumber || !centerId || !session.chapterId) {
      return new NextResponse(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const db = getDbConnection()
    
    // Check if supervisor already exists for this center
    const existing = await db.select()
      .from(supervisors)
      .where(and(
        eq(supervisors.centerId, centerId),
        eq(supervisors.isActive, true)
      ))
      .execute()
    
    if (existing.length > 0) {
      return new NextResponse(JSON.stringify({
        error: `A supervisor already exists for this center`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    const result = await db.insert(supervisors).values({
      chapterId: session.chapterId,
      centerId,
      name,
      phoneNumber,
      isActive: true
    }).returning().execute()
    
    return NextResponse.json({ supervisor: result[0] })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to create supervisor"
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
    
    const result = await db.update(supervisors)
      .set({ 
        name, 
        phoneNumber,
        updatedAt: new Date()
      })
      .where(and(
        eq(supervisors.id, id),
        eq(supervisors.chapterId, session.chapterId)
      ))
      .returning()
      .execute()
    
    if (result.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "Supervisor not found or not authorized"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    return NextResponse.json({ supervisor: result[0] })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to update supervisor"
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
      error: "Missing supervisor ID"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    const db = getDbConnection()
    
    const result = await db.update(supervisors)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(supervisors.id, parseInt(id)),
        eq(supervisors.chapterId, session.chapterId)
      ))
      .returning()
      .execute()
    
    if (result.length === 0) {
      return new NextResponse(JSON.stringify({
        error: "Supervisor not found or not authorized"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Database error:", error)
    return new NextResponse(JSON.stringify({
      error: "Failed to delete supervisor"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
