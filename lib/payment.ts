// Paystack Payment Integration
import { registrations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

// Get Paystack API keys from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

export async function initializePayment({
  email,
  amount,
  reference,
  callbackUrl,
  metadata,
  splitCode,
}: {
  email: string
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, any>
  splitCode?: string
}) {
  try {
    // Validate that the Paystack key is configured
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is not configured")
    }

    // Validate required parameters
    if (!email || !email.includes('@')) {
      throw new Error("Valid email is required")
    }
    
    if (!amount || amount <= 0) {
      throw new Error("Valid amount is required")
    }
    
    if (!reference || reference.trim().length === 0) {
      throw new Error("Payment reference is required")
    }
    
    if (!callbackUrl || !callbackUrl.startsWith('http')) {
      throw new Error("Valid callback URL is required")
    }

    // Convert amount to kobo (smallest currency unit in Nigeria)
    const amountInKobo = Math.round(amount * 100)

    const payload: any = {
      email: email.trim(),
      amount: amountInKobo,
      reference: reference.trim(),
      callback_url: callbackUrl,
    }

    // Add metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      payload.metadata = metadata
    }

    // Add split code if provided and valid
    if (splitCode && splitCode.trim().length > 0) {
      payload.split_code = splitCode.trim()
      console.log('Using split code:', splitCode.trim())
    }

    // Log the payload being sent for debugging
    console.log('Paystack payload:', JSON.stringify(payload, null, 2));

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Check for network or server errors
    if (!response.ok) {
      // Get the response body for more detailed error information
      const errorBody = await response.text();
      console.error('Paystack API error:', response.status, response.statusText);
      console.error('Paystack error body:', errorBody);
      
      // Try to parse error details if it's JSON
      try {
        const errorData = JSON.parse(errorBody);
        throw new Error(`Paystack API error: ${response.status} ${response.statusText} - ${errorData.message || errorBody}`);
      } catch {
        throw new Error(`Paystack API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }
    }

    const data = await response.json()
    
    // Log the response for debugging (sanitize sensitive data)
    console.log('Paystack response status:', data.status);
    console.log('Paystack response message:', data.message);
    
    if (!data.status) {
      throw new Error(data.message || "Failed to initialize payment")
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    }
  } catch (error) {
    console.error("Payment initialization error:", error)
    
    // Provide more specific error messages based on the error type
    let errorMessage = "An unknown error occurred during payment initialization";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common network-related errors
      if (error.message.includes("fetch")) {
        errorMessage = "Network error: Could not connect to payment gateway";
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function verifyPayment(reference: string) {
  try {
    // Validate that the Paystack key is configured
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is not configured")
    }
    
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    // Check for network or server errors
    if (!response.ok) {
      console.error('Paystack verification API error:', response.status, response.statusText);
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json()
    
    // Log the response for debugging (sanitize sensitive data)
    console.log('Paystack verification status:', data.status);
    console.log('Paystack verification message:', data.message);

    if (!data.status) {
      throw new Error(data.message || "Failed to verify payment")
    }

    // Check if payment was successful
    if (data.data.status === "success") {
      const db = getDbConnection();
      
      // Update registration payment status
      await db
        .update(registrations)
        .set({
          paymentStatus: "completed",
          paymentReference: reference,
        })
        .where(eq(registrations.paymentReference, reference))

      return {
        success: true,
        data: data.data,
      }
    }

    return {
      success: false,
      data: data.data,
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    
    // Provide more specific error messages based on the error type
    let errorMessage = "An unknown error occurred during payment verification";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common network-related errors
      if (error.message.includes("fetch")) {
        errorMessage = "Network error: Could not connect to payment gateway";
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    }
  }
}
