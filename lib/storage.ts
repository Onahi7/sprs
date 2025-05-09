// File Storage Integration with Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import { nanoid } from "nanoid";

// Define types for Cloudinary upload response
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  created_at: string;
  [key: string]: any;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export async function uploadPassportPhoto(file: File) {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image")
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB")
    }

    // Create a unique identifier for the file
    const uniqueId = nanoid(8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const publicId = `sprs_passports/passport_${uniqueId}`;

    // Convert File to buffer for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert buffer to base64 for Cloudinary's upload API
    const base64Data = buffer.toString('base64');
    const fileData = `data:${file.type};base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        fileData,
        {
          public_id: publicId,
          folder: "sprs_passports",
          resource_type: "auto",
          transformation: [
            { width: 400, height: 500, crop: "limit" },
            { quality: "auto:good" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
    });

    return {
      success: true,
      url: result.secure_url,
      filename: result.public_id,
    }
  } catch (error) {
    console.error("File upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
