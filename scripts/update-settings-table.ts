import { sql } from "drizzle-orm"
import { getDbConnection } from "@/db/utils"

async function addSettingsTimestamps() {
  const db = await getDbConnection()
  
  try {
    // Check if the columns exist
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'settings' AND column_name IN ('created_at', 'updated_at')
    `)

    if (result.rows.length < 2) {
      console.log("Adding timestamp columns to settings table...")
      
      // Add created_at column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE settings 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
      `)
      
      // Add updated_at column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE settings 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `)
      
      console.log("✅ Settings table updated with timestamp columns")
    } else {
      console.log("✅ Settings table already has timestamp columns")
    }
  } catch (error) {
    console.error("❌ Error updating settings table:", error)
  }
}

if (require.main === module) {
  addSettingsTimestamps()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { addSettingsTimestamps }
