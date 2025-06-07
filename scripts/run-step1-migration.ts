/**
 * Migration Script: Coordinator Slots System - Step 1
 * This script applies the database schema changes for the coordinator slot system
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    console.log('🚀 Starting Step 1: Coordinator Slots System Migration...')
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', '001_coordinator_slots_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    console.log('📝 Executing database schema changes...')
    await pool.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    console.log('\n📊 Migration Summary:')
    console.log('   - Added slot fields to chapter_coordinators table')
    console.log('   - Created slot_packages table')
    console.log('   - Created chapter_split_codes table')
    console.log('   - Created slot_purchases table')
    console.log('   - Created coordinator_slots table')
    console.log('   - Created slot_usage_history table')
    console.log('   - Added coordinator fields to registrations table')
    console.log('   - Created database functions and triggers')
    console.log('   - Added performance indexes')
    console.log('   - Created helpful views for coordinator dashboard')
    console.log('   - Inserted sample data for testing')
    
    // Verify the tables were created
    console.log('\n🔍 Verifying table creation...')
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'slot_packages', 
        'chapter_split_codes', 
        'slot_purchases', 
        'coordinator_slots', 
        'slot_usage_history'
      )
      ORDER BY table_name
    `)
    
    console.log('📋 Created tables:')
    tableCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })
    
    // Check sample data
    console.log('\n📦 Checking sample data...')
    const packageCount = await pool.query('SELECT COUNT(*) FROM slot_packages')
    const splitCodeCount = await pool.query('SELECT COUNT(*) FROM chapter_split_codes')
    
    console.log(`   ✓ Slot packages: ${packageCount.rows[0].count}`)
    console.log(`   ✓ Split codes: ${splitCodeCount.rows[0].count}`)
    
    console.log('\n🎉 Step 1 Migration completed successfully!')
    console.log('📝 Next: Run Step 2 to create the slot purchase interface')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✨ Ready to proceed to Step 2!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { runMigration }
