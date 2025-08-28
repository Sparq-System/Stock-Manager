import dotenv from 'dotenv'
import fs from 'fs'
import mongoose from 'mongoose'
import User from './models/User.js'

dotenv.config({ path: '.env.local' })

// Manual environment variable loading as fallback
if (!process.env.MONGODB_URI) {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8')
    const envVars = envFile.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=')
      if (key && value) {
        acc[key.trim()] = value.trim()
      }
      return acc
    }, {})
    process.env.MONGODB_URI = envVars.MONGODB_URI
  } catch (error) {
    console.error('Error reading .env.local file:', error.message)
  }
}

// Generate new format user code (3 letters + 3 numbers)
function generateNewFormatCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  // Generate 3 alphabetic characters
  let result = ''
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // Generate 3 numeric characters
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return result
}

// Check if code follows new format (3 letters + 3 numbers)
function isNewFormat(code) {
  const regex = /^[A-Z]{3}[0-9]{3}$/
  return regex.test(code)
}

// Generate unique code in new format
async function generateUniqueNewFormatCode() {
  let code
  let isUnique = false
  let attempts = 0
  const maxAttempts = 100

  while (!isUnique && attempts < maxAttempts) {
    code = generateNewFormatCode()
    const existingUser = await User.findOne({ userCode: code })
    if (!existingUser) {
      isUnique = true
    }
    attempts++
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique code after maximum attempts')
  }

  return code
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

async function migrateUserCodesToNewFormat() {
  try {
    await connectDB()

    // Find all users with codes that don't match the new format
    const usersToUpdate = await User.find({
      userCode: { $exists: true, $ne: null, $ne: '' },
      $expr: { $not: { $regexMatch: { input: '$userCode', regex: '^[A-Z]{3}[0-9]{3}$' } } }
    })

    console.log(`Found ${usersToUpdate.length} users with codes that need format conversion`)

    if (usersToUpdate.length === 0) {
      console.log('All users already have codes in the new format!')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const user of usersToUpdate) {
      try {
        const oldCode = user.userCode
        const newCode = await generateUniqueNewFormatCode()
        
        await User.findByIdAndUpdate(user._id, { userCode: newCode })
        console.log(`Updated user ${user.firstName} ${user.lastName}: ${oldCode} → ${newCode}`)
        successCount++
      } catch (error) {
        console.error(`Error updating user ${user.firstName} ${user.lastName}:`, error.message)
        errorCount++
      }
    }

    console.log(`\nMigration completed!`)
    console.log(`Successfully updated: ${successCount} users`)
    console.log(`Errors: ${errorCount} users`)

    // Verify the migration
    const remainingOldFormat = await User.find({
      userCode: { $exists: true, $ne: null, $ne: '' },
      $expr: { $not: { $regexMatch: { input: '$userCode', regex: '^[A-Z]{3}[0-9]{3}$' } } }
    })

    console.log(`\nVerification: ${remainingOldFormat.length} users still have old format codes`)
    
    if (remainingOldFormat.length > 0) {
      console.log('Users with old format codes:')
      remainingOldFormat.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName}: ${user.userCode}`)
      })
    }

  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
  }
}

// Run the migration
migrateUserCodesToNewFormat()
  .then(() => {
    console.log('Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })