// Load environment variables first, before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Now import modules that depend on environment variables
import dbConnect from '../lib/mongodb.js'
import Transaction from '../models/Transaction.js'
import PortfolioHistory from '../models/PortfolioHistory.js'
import NAV from '../models/NAV.js'
import User from '../models/User.js'

/**
 * Script to populate historical portfolio data from existing transactions
 * This creates daily snapshots of portfolio performance over time
 */

async function populateHistoricalData() {
  try {
    console.log('🚀 Starting historical data population...')
    await dbConnect()

    // Get all transactions sorted by date
    const transactions = await Transaction.find({ status: 'completed' })
      .sort({ createdAt: 1 })
      .populate('userId', 'investedAmount')

    if (transactions.length === 0) {
      console.log('❌ No completed transactions found')
      return
    }

    console.log(`📊 Found ${transactions.length} completed transactions`)

    // Get the date range
    const firstTransaction = transactions[0]
    const lastTransaction = transactions[transactions.length - 1]
    const startDate = new Date(firstTransaction.createdAt)
    const endDate = new Date(lastTransaction.createdAt)

    console.log(`📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`)

    // Clear existing historical data
    await PortfolioHistory.deleteMany({})
    console.log('🗑️ Cleared existing historical data')

    // Get NAV history for calculations
    const navHistory = await NAV.find().sort({ createdAt: 1 })
    const navMap = new Map()
    navHistory.forEach(nav => {
      const dateKey = nav.createdAt.toDateString()
      navMap.set(dateKey, nav.value)
    })

    // Track running totals
    let runningInvestedAmount = 0
    let runningUnits = 0
    const dailySnapshots = new Map()

    // Process each transaction
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.createdAt)
      const dateKey = transactionDate.toDateString()

      // Update running totals based on transaction type
      if (transaction.type === 'invest') {
        runningInvestedAmount += transaction.amount
        runningUnits += transaction.units || 0
      } else if (transaction.type === 'withdraw') {
        runningInvestedAmount -= transaction.amount
        runningUnits -= transaction.units || 0
      }

      // Get NAV for this date (use latest available if exact date not found)
      let navValue = transaction.navValue || 10 // Default NAV
      if (navMap.has(dateKey)) {
        navValue = navMap.get(dateKey)
      } else {
        // Find the closest NAV before this date
        for (const [navDate, nav] of navMap) {
          if (new Date(navDate) <= transactionDate) {
            navValue = nav
          } else {
            break
          }
        }
      }

      // Calculate current value
      const currentValue = runningUnits * navValue

      // Store daily snapshot
      dailySnapshots.set(dateKey, {
        date: new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate()),
        investedAmount: Math.max(0, runningInvestedAmount),
        currentValue: Math.max(0, currentValue),
        totalUnits: Math.max(0, runningUnits),
        navValue: navValue,
        returns: currentValue - runningInvestedAmount,
        returnsPercentage: runningInvestedAmount > 0 ? ((currentValue - runningInvestedAmount) / runningInvestedAmount) * 100 : 0,
        updatedBy: 'system',
        description: `Historical snapshot from transaction data`
      })
    }

    // Fill in missing days between transactions with interpolated data
    const sortedDates = Array.from(dailySnapshots.keys()).sort((a, b) => new Date(a) - new Date(b))
    const completeSnapshots = []

    for (let i = 0; i < sortedDates.length; i++) {
      const currentSnapshot = dailySnapshots.get(sortedDates[i])
      completeSnapshots.push(currentSnapshot)

      // Fill gaps between this date and next date
      if (i < sortedDates.length - 1) {
        const currentDate = new Date(sortedDates[i])
        const nextDate = new Date(sortedDates[i + 1])
        const daysDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24))

        // Add daily snapshots for missing days (keeping same values)
        for (let day = 1; day < daysDiff; day++) {
          const interpolatedDate = new Date(currentDate)
          interpolatedDate.setDate(currentDate.getDate() + day)

          // Get NAV for interpolated date
          let interpolatedNav = currentSnapshot.navValue
          const interpolatedDateKey = interpolatedDate.toDateString()
          if (navMap.has(interpolatedDateKey)) {
            interpolatedNav = navMap.get(interpolatedDateKey)
          }

          const interpolatedCurrentValue = currentSnapshot.totalUnits * interpolatedNav

          completeSnapshots.push({
            date: new Date(interpolatedDate.getFullYear(), interpolatedDate.getMonth(), interpolatedDate.getDate()),
            investedAmount: currentSnapshot.investedAmount,
            currentValue: interpolatedCurrentValue,
            totalUnits: currentSnapshot.totalUnits,
            navValue: interpolatedNav,
            returns: interpolatedCurrentValue - currentSnapshot.investedAmount,
            returnsPercentage: currentSnapshot.investedAmount > 0 ? ((interpolatedCurrentValue - currentSnapshot.investedAmount) / currentSnapshot.investedAmount) * 100 : 0,
            updatedBy: 'system',
            description: 'Interpolated historical snapshot'
          })
        }
      }
    }

    // Insert all snapshots into database
    if (completeSnapshots.length > 0) {
      await PortfolioHistory.insertMany(completeSnapshots)
      console.log(`✅ Created ${completeSnapshots.length} historical snapshots`)
    }

    // Create a snapshot for today if it doesn't exist
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySnapshot = await PortfolioHistory.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    })

    if (!todaySnapshot && completeSnapshots.length > 0) {
      const latestSnapshot = completeSnapshots[completeSnapshots.length - 1]
      const latestNav = await NAV.findOne().sort({ createdAt: -1 })
      const currentNav = latestNav?.value || latestSnapshot.navValue
      
      const todayCurrentValue = latestSnapshot.totalUnits * currentNav
      
      await PortfolioHistory.create({
        date: today,
        investedAmount: latestSnapshot.investedAmount,
        currentValue: todayCurrentValue,
        totalUnits: latestSnapshot.totalUnits,
        navValue: currentNav,
        returns: todayCurrentValue - latestSnapshot.investedAmount,
        returnsPercentage: latestSnapshot.investedAmount > 0 ? ((todayCurrentValue - latestSnapshot.investedAmount) / latestSnapshot.investedAmount) * 100 : 0,
        updatedBy: 'system',
        description: 'Current day snapshot'
      })
      
      console.log('📈 Created today\'s snapshot')
    }

    console.log('🎉 Historical data population completed successfully!')
    
  } catch (error) {
    console.error('❌ Error populating historical data:', error)
    throw error
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateHistoricalData()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
}

export default populateHistoricalData