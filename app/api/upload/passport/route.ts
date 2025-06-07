import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    // Check authentication and role
    if (!session || session.role !== "coordinator") {
      return NextResponse.json({ error: "Unauthorized. Coordinator access required." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload JPEG or PNG images only." 
      }, { status: 400 })
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Please upload an image smaller than 2MB." 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using server-side SDK
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "napps/passports",
          transformation: [
            { width: 400, height: 400, crop: "limit" },
            { quality: "auto:good" }
          ],
          format: "jpg" // Convert all images to JPG for consistency
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    const result = uploadResponse as any

    if (!result || !result.secure_url) {
      throw new Error('Upload failed - no URL returned')
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      message: "File uploaded successfully"
    })

  } catch (error) {
    console.error("Upload API error:", error)
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown upload error"

    return NextResponse.json({
      success: false,
      error: errorMessage.includes('configuration') || errorMessage.includes('credentials')
        ? "Upload service configuration error. Please contact support."
        : "Failed to upload file. Please try again."
    }, { status: 500 })
  }
}
