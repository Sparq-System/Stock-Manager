import dotenv from 'dotenv'
import dbConnect from './lib/mongodb.js'
import CurrentValue from './models/CurrentValue.js'
import PortfolioTotals from './models/PortfolioTotals.js'
import Trade from './models/Trade.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function initializeCurrentValue() {
  try {
    await dbConnect()
    console.log('Connected to database')
    
    // Check if current value already exists
    const existingCurrentValue = await CurrentValue.findOne()
    if (existingCurrentValue) {
      console.log(`Current value already exists: ${existingCurrentValue.value}`)
      return
    }
    
    // Get portfolio totals for total investment
    const portfolioTotals = await PortfolioTotals.findOne({})
    const totalInvestment = portfolioTotals ? portfolioTotals.totalInvestment : 0
    
    // Calculate total profit/loss from all trades
    const trades = await Trade.find({})
    let totalProfitLoss = 0
    
    for (const trade of trades) {
      if (trade.status === 'sold' && trade.finalProfitLoss !== null) {
        totalProfitLoss += trade.finalProfitLoss
      } else if (trade.status === 'partial' && trade.partialProfitLoss !== null) {
        totalProfitLoss += trade.partialProfitLoss
      }
    }
    
    // Calculate current value (total investment + profit/loss)
    const currentValue = totalInvestment + totalProfitLoss
    
    console.log('Initialization data:', {
      totalInvestment,
      totalProfitLoss,
      currentValue
    })
    
    // Initialize current value in database
    await CurrentValue.updateCurrentValue(
      currentValue,
      'manual',
      'Initial current value based on existing portfolio data'
    )
    
    console.log(`Current value initialized successfully: ${currentValue}`)
    
  } catch (error) {
    console.error('Error initializing current value:', error)
  } finally {
    process.exit(0)
  }
}

// Run the initialization
initializeCurrentValue()