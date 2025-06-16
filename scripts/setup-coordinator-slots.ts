/**
 * Sample data script for coordinator slots system
 * Run this to populate initial slot packages and split codes
 */

import { getDbConnection } from '../db/index'
import { slotPackages, chapterSplitCodes, chapters } from '../db/schema'
import { eq } from 'drizzle-orm'

async function populateSlotPackages() {
  const db = getDbConnection()
  
  console.log('🎯 Setting up slot packages...')
    // Create slot packages
  const packages = await db.insert(slotPackages).values([
    {
      name: '10 Slots Package',
      slotCount: 10,
      price: '12000.00', // ₦12,000
      description: 'Perfect for small-scale registration - Register up to 10 students',
      isActive: true,
    },
    {
      name: '50 Slots Package',
      slotCount: 50,
      price: '50000.00', // ₦50,000
      description: 'Register up to 50 students at once',
      isActive: true,
    },
    {
      name: '100 Slots Package',
      slotCount: 100,
      price: '95000.00', // ₦95,000 (5% discount)
      description: 'Register up to 100 students at once - Best Value!',
      isActive: true,
    },
    {
      name: '200 Slots Package',
      slotCount: 200,
      price: '180000.00', // ₦180,000 (10% discount from 200k)
      description: 'Bulk registration package - Register up to 200 students with maximum savings',
      isActive: true,
    }
  ]).returning()
  
  console.log(`✅ Created ${packages.length} slot packages`)
  
  return packages
}

async function populateSplitCodes() {
  const db = getDbConnection()
  
  console.log('🔄 Setting up chapter split codes...')
  
  // Get all chapters
  const allChapters = await db.select().from(chapters)
  
  // Get all slot packages
  const allPackages = await db.select().from(slotPackages).where(eq(slotPackages.isActive, true))
  
  const splitCodes = []
  
  for (const chapter of allChapters) {
    for (const package_ of allPackages) {
      // Generate sample split codes (in production, these would be actual Paystack split codes)
      const splitCode = `SPLT_${chapter.id}_${package_.id}_${Date.now()}`
      
      splitCodes.push({
        chapterId: chapter.id,
        slotPackageId: package_.id,
        splitCode: splitCode,
        isActive: true,
      })
    }
  }
  
  if (splitCodes.length > 0) {
    await db.insert(chapterSplitCodes).values(splitCodes)
    console.log(`✅ Created ${splitCodes.length} split codes for ${allChapters.length} chapters`)
  }
  
  return splitCodes
}

async function main() {
  try {
    console.log('🚀 Starting Step 1: Database Setup and Sample Data\n')
    
    // Populate slot packages
    const packages = await populateSlotPackages()
    
    // Populate split codes
    const splitCodes = await populateSplitCodes()
    
    console.log('\n✨ Step 1 Complete!')
    console.log('📊 Summary:')
    console.log(`   - ${packages.length} slot packages created`)
    console.log(`   - ${splitCodes.length} chapter split codes created`)
    console.log('\n🎯 Next Steps:')
    console.log('   - Step 2: Create slot purchase interface')
    console.log('   - Step 3: Implement Paystack payment integration')
    console.log('\n💡 Note: Update split codes with actual Paystack split codes in production')
    
  } catch (error) {
    console.error('❌ Error during setup:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { populateSlotPackages, populateSplitCodes }
