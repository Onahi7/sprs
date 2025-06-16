/**
 * Script to add new slot packages (10 and 200 slots) to existing coordinator slots system
 * Run this to add the new packages without affecting existing data
 */

import { getDbConnection } from '../db/index'
import { slotPackages, chapterSplitCodes, chapters } from '../db/schema'
import { eq, and } from 'drizzle-orm'

// Type for slot package
type SlotPackage = typeof slotPackages.$inferSelect

async function addNewSlotPackages(): Promise<SlotPackage[]> {
  const db = getDbConnection()
  
  console.log('🎯 Adding new slot packages (10 and 200 slots)...')
  
  // Check if packages already exist
  const existingPackages = await db
    .select()
    .from(slotPackages)
    .where(eq(slotPackages.slotCount, 10))
  
  if (existingPackages.length > 0) {
    console.log('⚠️ 10-slot package already exists, skipping creation')
  }
  
  const existing200Packages = await db
    .select()
    .from(slotPackages)
    .where(eq(slotPackages.slotCount, 200))
  
  if (existing200Packages.length > 0) {
    console.log('⚠️ 200-slot package already exists, skipping creation')
  }
  
  // Create new slot packages only if they don't exist
  const newPackages = []
  
  if (existingPackages.length === 0) {
    newPackages.push({
      name: '10 Slots Package',
      slotCount: 10,
      price: '12000.00', // ₦12,000
      description: 'Perfect for small-scale registration - Register up to 10 students',
      isActive: true,
    })
  }
  
  if (existing200Packages.length === 0) {
    newPackages.push({
      name: '200 Slots Package',
      slotCount: 200,
      price: '180000.00', // ₦180,000 (10% discount from 200k)
      description: 'Bulk registration package - Register up to 200 students with maximum savings',
      isActive: true,
    })
  }
    let createdPackages: SlotPackage[] = []
  if (newPackages.length > 0) {
    createdPackages = await db.insert(slotPackages).values(newPackages).returning()
    console.log(`✅ Created ${createdPackages.length} new slot packages`)
  }
  
  return createdPackages
}

async function addSplitCodesForNewPackages() {
  const db = getDbConnection()
  
  console.log('🔄 Setting up split codes for new packages...')
  
  // Get all chapters
  const allChapters = await db.select().from(chapters)
  
  // Get the new packages (10 and 200 slots)
  const newPackages = await db
    .select()
    .from(slotPackages)
    .where(eq(slotPackages.slotCount, 10))
  
  const newPackages200 = await db
    .select()
    .from(slotPackages)
    .where(eq(slotPackages.slotCount, 200))
  
  const allNewPackages = [...newPackages, ...newPackages200]
  
  const splitCodes = []
  
  for (const chapter of allChapters) {
    for (const package_ of allNewPackages) {
      // Check if split code already exists
      const existingSplitCode = await db
        .select()
        .from(chapterSplitCodes)
        .where(
          and(
            eq(chapterSplitCodes.chapterId, chapter.id),
            eq(chapterSplitCodes.slotPackageId, package_.id)
          )
        )
        .limit(1)
      
      if (existingSplitCode.length === 0) {
        // Generate split code based on chapter name and slot count
        const chapterPrefix = chapter.name?.toLowerCase().substring(0, 3) || 'chp'
        const splitCode = `SPL_${chapterPrefix}_${package_.slotCount}_2025`
        
        splitCodes.push({
          chapterId: chapter.id,
          slotPackageId: package_.id,
          splitCode: splitCode,
          isActive: true,
        })
      }
    }
  }
  
  if (splitCodes.length > 0) {
    await db.insert(chapterSplitCodes).values(splitCodes)
    console.log(`✅ Created ${splitCodes.length} new split codes`)
  } else {
    console.log('ℹ️ All split codes already exist')
  }
  
  return splitCodes
}

async function displayCurrentPackages() {
  const db = getDbConnection()
  
  console.log('\n📊 Current Slot Packages:')
  const packages = await db
    .select()
    .from(slotPackages)
    .where(eq(slotPackages.isActive, true))
  
  packages.forEach(pkg => {
    console.log(`  • ${pkg.name}: ${pkg.slotCount} slots - ₦${pkg.price}`)
    console.log(`    ${pkg.description}`)
  })
  
  console.log(`\nTotal active packages: ${packages.length}`)
}

async function main() {
  try {
    console.log('🚀 Adding new slot packages to coordinator slots system\n')
    
    // Add new slot packages
    const newPackages = await addNewSlotPackages()
    
    // Add split codes for new packages
    await addSplitCodesForNewPackages()
    
    // Display all current packages
    await displayCurrentPackages()
    
    console.log('\n✅ Successfully added new slot packages!')
    console.log('📋 Available packages: 10, 50, 100, 200 slots')
    console.log('💰 Pricing: ₦12k, ₦50k, ₦95k, ₦180k respectively')
    
  } catch (error) {
    console.error('❌ Error adding new slot packages:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 New slot packages setup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error)
      process.exit(1)
    })
}

export { addNewSlotPackages, addSplitCodesForNewPackages }
