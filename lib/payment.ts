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
}: {
  email: string
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, any>
}) {
  try {
    // Validate that the Paystack key is configured
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack secret key is not configured")
    }

    // Convert amount to kobo (smallest currency unit in Nigeria)
    const amountInKobo = Math.round(amount * 100)

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl,
        metadata,
      }),
    })

    // Check for network or server errors
    if (!response.ok) {
      console.error('Paystack API error:', response.status, response.statusText);
      throw new Error(`Paystack API error: ${response.status} ${response.statusText}`);
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
