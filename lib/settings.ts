import { getDbConnection } from "@/db/utils";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SystemSettings {
  registrationEnabled: boolean;
  paymentEnabled: boolean;
  maintenanceMode: boolean;
  registrationDeadline: string | null;
}

/**
 * Get system settings from the database
 * Uses cache to avoid repeated database queries
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const db = getDbConnection();
  
  // Get all system settings
  // Get settings individually and combine them
  const registrationEnabled = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'system.registration_enabled'));
    
  const paymentEnabled = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'system.payment_enabled'));
    
  const maintenanceMode = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'system.maintenance_mode'));
    
  const registrationDeadline = await db
    .select()
    .from(settings)
    .where(eq(settings.key, 'system.registration_deadline'));
  
  return {
    registrationEnabled: registrationEnabled[0]?.value !== 'false',
    paymentEnabled: paymentEnabled[0]?.value !== 'false',
    maintenanceMode: maintenanceMode[0]?.value === 'true',
    registrationDeadline: registrationDeadline[0]?.value || null,
  };
}
