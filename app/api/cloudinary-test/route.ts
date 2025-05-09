import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET() {
  try {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    
    // Test the connection by pinging the API
    const pingResult = await cloudinary.api.ping();
    
    // Include configuration in the response (but mask the API secret)
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 
        process.env.CLOUDINARY_API_KEY.substring(0, 4) + '...' : 'not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 
        '✓ configured' : 'not set'
    };
    
    return NextResponse.json({
      success: true,
      message: 'Cloudinary connection successful',
      config,
      ping: pingResult
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    
    // Return detailed error information
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not set',
        api_key: process.env.CLOUDINARY_API_KEY ? 
          process.env.CLOUDINARY_API_KEY.substring(0, 4) + '...' : 'not set',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 
          '✓ configured' : 'not set'
      }
    }, { status: 500 });
  }
}
