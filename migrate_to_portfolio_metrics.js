import dotenv from 'dotenv'
import mongoose from 'mongoose'
import NAV from './models/NAV.js'
import PortfolioMetrics from './models/PortfolioMetrics.js'
import User from './models/User.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

async function migrateToPortfolioMetrics() {
  try {
    console.log('Starting migration to PortfolioMetrics...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    
    // Get all existing NAV records
    const navRecords = await NAV.find({}).sort({ date: 1 })
    console.log(`Found ${navRecords.length} NAV records to migrate`)
    
    // Calculate current total units from all users
    const users = await User.find({}, 'units')
    const currentTotalUnits = users.reduce((sum, user) => sum + (user.units || 0), 0)
    console.log(`Current total units across all users: ${currentTotalUnits}`)
    
    // Check if PortfolioMetrics already has records
    const existingMetrics = await PortfolioMetrics.countDocuments()
    if (existingMetrics > 0) {
      console.log(`Found ${existingMetrics} existing PortfolioMetrics records. Updating totalUnits...`)
      
      // Update existing records with current total units
      const latestMetrics = await PortfolioMetrics.findOne().sort({ date: -1 })
      if (latestMetrics) {
        latestMetrics.totalUnits = currentTotalUnits
        await latestMetrics.save()
        console.log(`Updated latest PortfolioMetrics record with totalUnits: ${currentTotalUnits}`)
      }
    } else {
      console.log('No existing PortfolioMetrics records found. Creating from NAV data...')
      
      // Migrate NAV records to PortfolioMetrics
      for (let i = 0; i < navRecords.length; i++) {
        const navRecord = navRecords[i]
        
        // For the latest record, use current total units
        // For older records, we'll use 0 as we don't have historical unit data
        const totalUnits = (i === navRecords.length - 1) ? currentTotalUnits : 0
        
        const portfolioMetrics = new PortfolioMetrics({
          date: navRecord.date,
          value: navRecord.value,
          totalUnits: totalUnits,
          updatedBy: navRecord.updatedBy
        })
        
        await portfolioMetrics.save()
        console.log(`Migrated NAV record for ${navRecord.date.toISOString().split('T')[0]} with totalUnits: ${totalUnits}`)
      }
    }
    
    // If no NAV records exist, create an initial PortfolioMetrics record
    if (navRecords.length === 0) {
      console.log('No NAV records found. Creating initial PortfolioMetrics record...')
      
      const initialMetrics = new PortfolioMetrics({
        date: new Date(),
        value: 10, // Default NAV value
        totalUnits: currentTotalUnits
      })
      
      await initialMetrics.save()
      console.log(`Created initial PortfolioMetrics record with NAV: 10, totalUnits: ${currentTotalUnits}`)
    }
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.connection.close()
  }
}

// Run the migration
// migrateToPortfolioMetrics()
// This migration script has been disabled to prevent repeated execution
// Uncomment the line above only if you need to run the migration again
console.log('Migration script is disabled. Uncomment the function call if migration is needed.')