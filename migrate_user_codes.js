import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import mongoose from 'mongoose'
import User from './models/User.js'
import { generateUniqueUserCode } from './utils/userCodeGenerator.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Manual environment loading as fallback
if (!process.env.MONGODB_URI) {
  try {
    const envContent = readFileSync('.env.local', 'utf8')
    const lines = envContent.split('\n')
    lines.forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    })
  } catch (error) {
    console.error('Failed to load .env.local manually:', error.message)
  }
}

// Database connection function
async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined')
  }
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')
  }
}

/**
 * Migration script to assign unique user codes to existing users
 */
async function migrateUserCodes() {
  try {
    console.log('🚀 Starting user code migration...')
    
    // Connect to database
    await connectDB()
    console.log('✅ Connected to database')
    
    // Find all users without userCode
    const usersWithoutCode = await User.find({ 
      $or: [
        { userCode: { $exists: false } },
        { userCode: null },
        { userCode: '' }
      ]
    })
    
    console.log(`📊 Found ${usersWithoutCode.length} users without unique codes`)
    
    if (usersWithoutCode.length === 0) {
      console.log('✅ All users already have unique codes!')
      return
    }
    
    let updatedCount = 0
    
    // Process each user
    for (const user of usersWithoutCode) {
      try {
        // Generate unique code
        const userCode = await generateUniqueUserCode()
        
        // Update user with new code
        await User.findByIdAndUpdate(user._id, { userCode })
        
        updatedCount++
        console.log(`✅ Updated user ${user.firstName} ${user.lastName} (${user.email}) with code: ${userCode}`)
        
      } catch (error) {
        console.error(`❌ Failed to update user ${user.email}:`, error.message)
      }
    }
    
    console.log(`\n🎉 Migration completed successfully!`)
    console.log(`📈 Updated ${updatedCount} out of ${usersWithoutCode.length} users`)
    
    // Verify all users now have codes
    const remainingUsers = await User.find({ 
      $or: [
        { userCode: { $exists: false } },
        { userCode: null },
        { userCode: '' }
      ]
    })
    
    if (remainingUsers.length === 0) {
      console.log('✅ Verification passed: All users now have unique codes!')
    } else {
      console.log(`⚠️  Warning: ${remainingUsers.length} users still without codes`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    // Close database connection
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run migration
migrateUserCodes()