/**
 * Script to check for duplicate registrations in the database
 * Run this to identify existing duplicates and their patterns
 */

import { getDbConnection } from '../db/utils'
import { registrations } from '../db/schema'
import { sql } from 'drizzle-orm'

async function checkDuplicateRegistrations() {
  try {
    console.log('🔍 Checking for duplicate registrations...\n')

    const db = getDbConnection()

    // Query to find exact duplicate names within chapters
    const exactDuplicatesQuery = `
      WITH duplicate_groups AS (
        SELECT 
          TRIM(LOWER(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name))) as full_name_normalized,
          chapter_id,
          COUNT(*) as duplicate_count,
          MIN(created_at) as first_registration,
          MAX(created_at) as last_registration,
          coordinator_registered_by
        FROM registrations 
        GROUP BY full_name_normalized, chapter_id, coordinator_registered_by
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC, last_registration DESC
      )
      SELECT 
        d.full_name_normalized,
        d.chapter_id,
        d.coordinator_registered_by,
        d.duplicate_count,
        d.first_registration,
        d.last_registration,
        EXTRACT(EPOCH FROM (d.last_registration - d.first_registration)) / 60 as minutes_between
      FROM duplicate_groups d
    `

    const duplicateGroups = await db.execute(sql.raw(exactDuplicatesQuery))
    
    if (duplicateGroups.rows.length === 0) {
      console.log('✅ No exact duplicate names found!')
      return
    }

    console.log(`🚨 Found ${duplicateGroups.rows.length} duplicate groups:\n`)

    let totalDuplicates = 0
    let coordinatorDuplicates = 0
    let rapidDuplicates = 0

    for (const group of duplicateGroups.rows) {
      const {
        full_name_normalized,
        chapter_id,
        coordinator_registered_by,
        duplicate_count,
        first_registration,
        last_registration,
        minutes_between
      } = group

      totalDuplicates += Number(duplicate_count) - 1 // Subtract 1 because first registration is not a duplicate
      
      if (coordinator_registered_by) {
        coordinatorDuplicates += Number(duplicate_count) - 1
      }

      if (Number(minutes_between) < 5) { // Less than 5 minutes between first and last
        rapidDuplicates += Number(duplicate_count) - 1
      }

      console.log(`👤 Name: ${full_name_normalized}`)
      console.log(`   Chapter ID: ${chapter_id}`)
      console.log(`   Coordinator ID: ${coordinator_registered_by || 'Public Registration'}`)
      console.log(`   Count: ${duplicate_count} registrations`)
      console.log(`   Time span: ${Number(minutes_between).toFixed(1)} minutes`)
      console.log(`   First: ${first_registration}`)
      console.log(`   Last: ${last_registration}`)
      
      if (Number(minutes_between) < 1) {
        console.log(`   ⚠️  RAPID DUPLICATES - Less than 1 minute apart!`)
      }
      console.log()
    }

    console.log('📊 Summary:')
    console.log(`   Total duplicate registrations: ${totalDuplicates}`)
    console.log(`   From coordinator portal: ${coordinatorDuplicates}`)
    console.log(`   From public portal: ${totalDuplicates - coordinatorDuplicates}`)
    console.log(`   Rapid duplicates (< 5 min): ${rapidDuplicates}`)

    if (rapidDuplicates > 0) {
      console.log('\n💡 Rapid duplicates suggest:')
      console.log('   - Multiple form submissions due to slow responses')
      console.log('   - Users clicking submit button multiple times')
      console.log('   - Browser issues or network problems')
      console.log('   - Missing client-side submission prevention')
    }

    // Get registration numbers for rapid duplicates to investigate
    console.log('\n🔍 Recent rapid duplicates (last 24 hours):')
    const recentRapidQuery = `
      SELECT 
        r1.registration_number,
        r1.first_name,
        r1.last_name,
        r1.coordinator_registered_by,
        r1.created_at,
        r2.registration_number as duplicate_reg,
        r2.created_at as duplicate_time,
        EXTRACT(EPOCH FROM (r2.created_at - r1.created_at)) / 60 as minutes_diff
      FROM registrations r1
      JOIN registrations r2 ON (
        TRIM(LOWER(CONCAT(r1.first_name, ' ', COALESCE(r1.middle_name, ''), ' ', r1.last_name))) = 
        TRIM(LOWER(CONCAT(r2.first_name, ' ', COALESCE(r2.middle_name, ''), ' ', r2.last_name)))
        AND r1.chapter_id = r2.chapter_id
        AND r1.id < r2.id
        AND EXTRACT(EPOCH FROM (r2.created_at - r1.created_at)) / 60 < 60
      )
      WHERE r1.created_at > NOW() - INTERVAL '24 hours'
      ORDER BY r1.created_at DESC
      LIMIT 10
    `

    const recentRapid = await db.execute(sql.raw(recentRapidQuery))
    
    if (recentRapid.rows.length > 0) {
      for (const rapid of recentRapid.rows) {
        console.log(`   ${rapid.first_name} ${rapid.last_name}:`)
        console.log(`     First: ${rapid.registration_number} at ${rapid.created_at}`)
        console.log(`     Second: ${rapid.duplicate_reg} at ${rapid.duplicate_time}`)
        console.log(`     Gap: ${Number(rapid.minutes_diff).toFixed(1)} minutes`)
        console.log(`     Coordinator: ${rapid.coordinator_registered_by || 'Public'}`)
        console.log()
      }
    } else {
      console.log('   No rapid duplicates in last 24 hours')
    }

  } catch (error) {
    console.error('❌ Error checking duplicates:', error)
  }
}

// Run the check
checkDuplicateRegistrations()
  .then(() => {
    console.log('\n🏁 Duplicate check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Check failed:', error)
    process.exit(1)
  })
