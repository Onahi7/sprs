/**
 * Simple script to add 10 and 200 slot packages to the existing system
 * Run this to add the new packages without affecting existing data
 */

import { getDbConnection } from '../db/index'
import { slotPackages, chapterSplitCodes, chapters } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'

async function addNewSlotPackages() {
  const db = getDbConnection()
  
  console.log('🎯 Adding 10 and 200 slot packages...')
  
  // Check if packages already exist
  const existingPackages = await db
    .select()
    .from(slotPackages)
    .where(inArray(slotPackages.slotCount, [10, 200]))
  
  console.log(`Found ${existingPackages.length} existing packages`)
  
  const newPackages = []
  
  // Add 10-slot package if it doesn't exist
  if (!existingPackages.some(p => p.slotCount === 10)) {
    newPackages.push({
      name: '10 Slots Package',
      slotCount: 10,
      price: '12000.00',
      description: 'Perfect for small-scale registration - Register up to 10 students',
      isActive: true,
    })
  }
  
  // Add 200-slot package if it doesn't exist
  if (!existingPackages.some(p => p.slotCount === 200)) {
    newPackages.push({
      name: '200 Slots Package',
      slotCount: 200,
      price: '180000.00',
      description: 'Bulk registration package - Register up to 200 students with maximum savings',
      isActive: true,
    })
  }
  
  if (newPackages.length === 0) {
    console.log('✅ All packages already exist')
    return []
  }
  
  const createdPackages = await db.insert(slotPackages).values(newPackages).returning()
  console.log(`✅ Created ${createdPackages.length} new packages`)
  
  return createdPackages
}

async function addSplitCodes(packageIds: number[]) {
  if (packageIds.length === 0) return
  
  const db = getDbConnection()
  
  console.log('🔄 Adding split codes for new packages...')
  
  // Get all chapters
  const allChapters = await db.select().from(chapters)
  
  const splitCodes = []
  
  for (const chapter of allChapters) {
    for (const packageId of packageIds) {
      // Check if split code already exists
      const existing = await db
        .select()
        .from(chapterSplitCodes)
        .where(
          and(
            eq(chapterSplitCodes.chapterId, chapter.id),
            eq(chapterSplitCodes.slotPackageId, packageId)
          )
        )
        .limit(1)
      
      if (existing.length === 0) {
        // Get package info for split code generation
        const pkg = await db.select().from(slotPackages).where(eq(slotPackages.id, packageId)).limit(1)
        if (pkg.length > 0) {
          const chapterPrefix = chapter.name?.toLowerCase().substring(0, 3) || 'chp'
          const splitCode = `SPL_${chapterPrefix}_${pkg[0].slotCount}_2025`
          
          splitCodes.push({
            chapterId: chapter.id,
            slotPackageId: packageId,
            splitCode: splitCode,
            isActive: true,
          })
        }
      }
    }
  }
  
  if (splitCodes.length > 0) {
    await db.insert(chapterSplitCodes).values(splitCodes)
    console.log(`✅ Created ${splitCodes.length} split codes`)
  } else {
    console.log('ℹ️ All split codes already exist')
  }
}

async function main() {
  try {
    console.log('🚀 Adding new slot packages to existing system...\n')
    
    // Add new packages
    const newPackages = await addNewSlotPackages()
    
    // Add split codes for new packages
    if (newPackages.length > 0) {
      await addSplitCodes(newPackages.map(p => p.id))
    }
    
    // Display final state
    const db = getDbConnection()
    const allPackages = await db
      .select()
      .from(slotPackages)
      .where(eq(slotPackages.isActive, true))
    
    console.log('\n📊 Available slot packages:')
    allPackages.forEach(pkg => {
      console.log(`  • ${pkg.name}: ${pkg.slotCount} slots - ₦${parseFloat(pkg.price).toLocaleString()}`)
    })
    
    console.log('\n✅ New slot packages added successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Failed:', error)
      process.exit(1)
    })
}

export { addNewSlotPackages }
