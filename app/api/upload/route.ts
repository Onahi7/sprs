import { NextResponse } from "next/server"
import { uploadPassportPhoto } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check if required Cloudinary environment variables are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary configuration")
      return NextResponse.json(
        { error: "Server is not properly configured for file uploads. Contact administrator." },
        { status: 500 }
      )
    }

    const result = await uploadPassportPhoto(file)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ url: result.url, filename: result.filename })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 },
    )
  }
}
