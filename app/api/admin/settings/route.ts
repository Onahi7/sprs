import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
// import { authOptions } from "@/lib/auth"
import { getDbConnection } from "@/db/utils"
import { settings } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export async function GET() {
  try {
    // const session = await getServerSession(authOptions)
    // TODO: Replace with actual session/auth logic if needed
    const session = { user: { role: "admin", email: "dev@example.com" } } // TEMP: allow admin for now
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDbConnection()
    const allSettings = await db.select().from(settings)

    // Convert to key-value object and group by section
    const settingsObject = allSettings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string | null>,
    )

    // Structure settings by sections for the UI
    const structuredSettings = {
      email: {
        host: settingsObject["email.host"] || process.env.EMAIL_SERVER_HOST || "",
        port: settingsObject["email.port"] || process.env.EMAIL_SERVER_PORT || "587",
        secure: settingsObject["email.secure"] || process.env.EMAIL_SERVER_SECURE || "false",
        user: settingsObject["email.user"] || process.env.EMAIL_SERVER_USER || "",
        password: "", // Never return the actual password
        from: settingsObject["email.from"] || process.env.EMAIL_FROM || "",
        enabled: settingsObject["email.enabled"] === "true"
      },
      payment: {
        paystackEnabled: settingsObject["payment.paystack_enabled"] !== "false",
        paystackPublicKey: settingsObject["payment.paystack_public_key"] || process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        paystackSecretKey: "", // Never return the actual secret key
        testMode: settingsObject["payment.test_mode"] !== "false",
        webhookUrl: settingsObject["payment.webhook_url"] || `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
        callbackUrl: settingsObject["payment.callback_url"] || `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`
      },
      system: {
        appName: settingsObject["system.app_name"] || "NAPPS Nasarawa State Unified Exams",
        appUrl: settingsObject["system.app_url"] || process.env.NEXT_PUBLIC_BASE_URL || "",
        registrationEnabled: settingsObject["system.registration_enabled"] !== "false",
        paymentEnabled: settingsObject["system.payment_enabled"] !== "false",
        emailNotifications: settingsObject["system.email_notifications"] !== "false",
        maintenanceMode: settingsObject["system.maintenance_mode"] === "true",
        maxRegistrationsPerUser: parseInt(settingsObject["system.max_registrations_per_user"] || "1"),
        registrationDeadline: settingsObject["system.registration_deadline"] || "",
        supportEmail: settingsObject["system.support_email"] || process.env.EMAIL_SERVER_USER || "",
        supportPhone: settingsObject["system.support_phone"] || ""
      },
      notifications: {
        sendRegistrationConfirmation: settingsObject["notifications.send_registration_confirmation"] !== "false",
        sendPaymentConfirmation: settingsObject["notifications.send_payment_confirmation"] !== "false",
        sendCoordinatorNotification: settingsObject["notifications.send_coordinator_notification"] !== "false",
        notifyAdminOnRegistration: settingsObject["notifications.notify_admin_on_registration"] !== "false",
        notifyAdminOnPayment: settingsObject["notifications.notify_admin_on_payment"] !== "false",
        dailyReportEmail: settingsObject["notifications.daily_report_email"] || "",
        weeklyReportEmail: settingsObject["notifications.weekly_report_email"] || ""
      }
    }

    return NextResponse.json(structuredSettings)
  } catch (error) {
    console.error("Settings GET error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    // const session = await getServerSession(authOptions)
    // TODO: Replace with actual session/auth logic if needed
    const session = { user: { role: "admin", email: "dev@example.com" } } // TEMP: allow admin for now
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { section, settings: sectionSettings } = await request.json()

    if (!section || !sectionSettings) {
      return NextResponse.json(
        { error: "Section and settings are required" },
        { status: 400 }
      )
    }

    const validSections = ["email", "payment", "system", "notifications"]
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: "Invalid settings section" },
        { status: 400 }
      )
    }

    const db = await getDbConnection()

    // Convert section settings to flat key-value pairs
    const flatSettings: Record<string, string> = {}
    
    if (section === "email") {
      Object.entries(sectionSettings).forEach(([key, value]) => {
        if (key !== "password" || value) { // Only update password if provided
          flatSettings[`email.${key}`] = String(value)
        }
      })
    } else if (section === "payment") {
      Object.entries(sectionSettings).forEach(([key, value]) => {
        if (key !== "paystackSecretKey" || value) { // Only update secret key if provided
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
          flatSettings[`payment.${dbKey}`] = String(value)
        }
      })
    } else if (section === "system") {
      Object.entries(sectionSettings).forEach(([key, value]) => {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        flatSettings[`system.${dbKey}`] = String(value)
      })
    } else if (section === "notifications") {
      Object.entries(sectionSettings).forEach(([key, value]) => {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        flatSettings[`notifications.${dbKey}`] = String(value)
      })
    }

    // Update each setting in the database
    for (const [key, value] of Object.entries(flatSettings)) {
      // Check if setting exists
      const existingSetting = await db.select().from(settings).where(eq(settings.key, key)).limit(1)

      if (existingSetting.length > 0) {
        // Update existing setting
        await db
          .update(settings)
          .set({ 
            value: value,
            updatedAt: new Date()
          })
          .where(eq(settings.key, key))
      } else {
        // Create new setting
        await db.insert(settings).values({
          key,
          value: value,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }

    // Log the settings update (don't log sensitive data)
    console.log(`Settings updated for section: ${section}`, {
      timestamp: new Date().toISOString(),
      user: session.user.email,
      section,
      keysUpdated: Object.keys(flatSettings).filter(key => 
        !key.includes('password') && !key.includes('secret')
      )
    })

    return NextResponse.json({ 
      success: true, 
      message: `${section} settings updated successfully` 
    })
  } catch (error) {
    console.error("Settings PUT error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

// Get system statistics for settings overview
export async function POST(request: Request) {
  try {
    // const session = await getServerSession(authOptions)
    // TODO: Replace with actual session/auth logic if needed
    const session = { user: { role: "admin", email: "dev@example.com" } } // TEMP: allow admin for now
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === "getStats") {
      const db = await getDbConnection()
      
      // Get system statistics
      const registrationResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM registrations`
      );
      const paymentResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM registrations WHERE payment_status = 'completed'`
      );
      const coordinatorResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM chapter_coordinators`
      );
      const chapterResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM chapters`
      );

      const stats = {
        totalRegistrations: registrationResult.rows[0]?.count || 0,
        completedPayments: paymentResult.rows[0]?.count || 0,
        totalCoordinators: coordinatorResult.rows[0]?.count || 0,
        totalChapters: chapterResult.rows[0]?.count || 0,
        systemUptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      }

      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Settings POST error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
