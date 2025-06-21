#!/usr/bin/env tsx

/**
 * Script to create center-based result entry users
 * 
 * Usage: npx tsx scripts/setup-center-result-users.ts
 */

import { db } from "../db"
import { resultEntryUsers, centers, chapters } from "../db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

interface CenterResultUser {
  username: string
  password: string
  name: string
  email?: string
  chapterId: number
  centerId: number
}

// Example data - modify this based on your actual centers and requirements
const centerResultUsers: CenterResultUser[] = [
  {
    username: "lagos_center1_results",
    password: "results123", // This will be hashed
    name: "Lagos Center 1 Results Entry",
    email: "lagos.center1.results@example.com",
    chapterId: 1, // Lagos chapter ID
    centerId: 1, // Specific center ID within Lagos
  },
  {
    username: "lagos_center2_results", 
    password: "results123",
    name: "Lagos Center 2 Results Entry",
    email: "lagos.center2.results@example.com",
    chapterId: 1,
    centerId: 2,
  },
  // Add more center result users as needed
]

async function setupCenterResultUsers() {
  try {
    console.log("Setting up center-based result entry users...")

    if (!db) {
      throw new Error("Database connection not available")
    }

    // First, let's see what centers exist
    const existingCenters = await db
      .select({
        id: centers.id,
        name: centers.name,
        chapterId: centers.chapterId,
        chapterName: chapters.name,
      })
      .from(centers)
      .leftJoin(chapters, eq(centers.chapterId, chapters.id))

    console.log("\\nExisting centers:")
    existingCenters.forEach(center => {
      console.log(`- Center ${center.id}: ${center.name} (Chapter: ${center.chapterName})`)
    })

    // Create result entry users for each center
    for (const userData of centerResultUsers) {
      try {
        // Check if user already exists
        const existingUser = await db
          .select()
          .from(resultEntryUsers)
          .where(eq(resultEntryUsers.username, userData.username))
          .limit(1)

        if (existingUser.length > 0) {
          console.log(`⚠️  User ${userData.username} already exists, skipping...`)
          continue
        }

        // Verify center exists
        const centerExists = existingCenters.find(c => c.id === userData.centerId)
        if (!centerExists) {
          console.log(`❌ Center ID ${userData.centerId} does not exist, skipping user ${userData.username}`)
          continue
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10)

        // Create user
        const newUser = await db
          .insert(resultEntryUsers)
          .values({
            username: userData.username,
            password: hashedPassword,
            name: userData.name,
            email: userData.email,
            chapterId: userData.chapterId,
            centerId: userData.centerId,
            isActive: true,
          })
          .returning()

        console.log(`✅ Created result entry user: ${userData.name} for center: ${centerExists.name}`)
        console.log(`   Username: ${userData.username}`)
        console.log(`   Center: ${centerExists.name} (${centerExists.chapterName})`)
        
      } catch (error) {
        console.error(`❌ Error creating user ${userData.username}:`, error)
      }
    }

    console.log("\\n✅ Center-based result entry user setup completed!")
    console.log("\\n📝 Next steps:")
    console.log("1. Run the database migration: add-center-to-result-entry-users.sql")
    console.log("2. Update existing result entry users to assign them to specific centers")
    console.log("3. Test the login functionality with the new center-based credentials")

  } catch (error) {
    console.error("❌ Error setting up center result users:", error)
    process.exit(1)
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupCenterResultUsers()
    .then(() => {
      console.log("\\n🎉 Setup completed successfully!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("💥 Setup failed:", error)
      process.exit(1)
    })
}

export { setupCenterResultUsers }
