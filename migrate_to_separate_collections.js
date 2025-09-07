import dotenv from 'dotenv'
import mongoose from 'mongoose'
import PortfolioMetrics from './models/PortfolioMetrics.js'
import NAV from './models/NAV.js'
import TotalUnits from './models/TotalUnits.js'
import User from './models/User.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

async function migrateToSeparateCollections() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get all existing PortfolioMetrics records
    const portfolioMetrics = await PortfolioMetrics.find().sort({ date: 1 })
    console.log(`Found ${portfolioMetrics.length} PortfolioMetrics records`)

    if (portfolioMetrics.length === 0) {
      console.log('No PortfolioMetrics records found to migrate')
      return
    }

    // Migrate NAV data
    console.log('Migrating NAV data...')
    for (const metric of portfolioMetrics) {
      const existingNAV = await NAV.findOne({ date: metric.date })
      
      if (!existingNAV) {
        const navRecord = new NAV({
          date: metric.date,
          value: metric.value,
          updatedBy: metric.updatedBy
        })
        await navRecord.save()
        console.log(`Created NAV record for date: ${metric.date.toISOString().split('T')[0]}`)
      } else {
        console.log(`NAV record already exists for date: ${metric.date.toISOString().split('T')[0]}`)
      }
    }

    // Create single TotalUnits record with the latest totalUnits value
    console.log('Creating TotalUnits record...')
    const existingTotalUnits = await TotalUnits.findOne()
    
    if (!existingTotalUnits) {
      // Get the latest totalUnits from PortfolioMetrics or calculate from users
      let latestTotalUnits = 0
      
      if (portfolioMetrics.length > 0) {
        const latestMetric = portfolioMetrics[portfolioMetrics.length - 1]
        latestTotalUnits = latestMetric.totalUnits || 0
      }
      
      // If no totalUnits in PortfolioMetrics, calculate from users
      if (latestTotalUnits === 0) {
        const users = await User.find({}, 'units')
        latestTotalUnits = users.reduce((sum, user) => sum + (user.units || 0), 0)
        console.log(`Calculated totalUnits from users: ${latestTotalUnits}`)
      }
      
      const totalUnitsRecord = new TotalUnits({
        totalUnits: latestTotalUnits
      })
      await totalUnitsRecord.save()
      console.log(`Created TotalUnits record with value: ${latestTotalUnits}`)
    } else {
      console.log(`TotalUnits record already exists with value: ${existingTotalUnits.totalUnits}`)
    }

    console.log('Migration completed successfully!')
    console.log('\nSummary:')
    console.log(`- Migrated ${portfolioMetrics.length} NAV records`)
    console.log('- Created/verified TotalUnits record')
    console.log('\nYou can now safely remove the PortfolioMetrics collection if desired.')
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed')
  }
}

// migrateToSeparateCollections()
// This migration script has been disabled to prevent repeated execution
// Uncomment the line above only if you need to run the migration again
console.log('Migration script is disabled. Uncomment the function call if migration is needed.')