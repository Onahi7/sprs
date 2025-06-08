#!/usr/bin/env node

import { Pool } from 'pg'

async function addSplitCodeColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    console.log('🔄 Adding split_code_used column to registrations table...')
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'registrations' 
      AND column_name = 'split_code_used'
    `)
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column split_code_used already exists in registrations table')
      return
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE registrations 
      ADD COLUMN split_code_used TEXT
    `)
    
    console.log('✅ Successfully added split_code_used column to registrations table')
    
    // Optionally, you can backfill existing registrations with their chapter's split code
    console.log('🔄 Backfilling existing registrations with chapter split codes...')
    
    const backfillResult = await pool.query(`
      UPDATE registrations 
      SET split_code_used = chapters.split_code
      FROM chapters 
      WHERE registrations.chapter_id = chapters.id 
      AND registrations.payment_status = 'completed'
      AND registrations.split_code_used IS NULL
      AND chapters.split_code IS NOT NULL
    `)
    
    console.log(`✅ Backfilled ${backfillResult.rowCount} registrations with chapter split codes`)
    
  } catch (error) {
    console.error('❌ Error adding split_code_used column:', error)
    throw error
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  addSplitCodeColumn()
    .then(() => {
      console.log('✅ Migration completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    })
}

export { addSplitCodeColumn }
