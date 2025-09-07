import dbConnect from '../lib/mongodb'
import NAV from '../models/NAV'
import Holding from '../models/Holding'
import PortfolioTotals from '../models/PortfolioTotals'
import CurrentValue from '../models/CurrentValue'

/**
 * Calculate and update NAV automatically
 * NAV = Total Portfolio Valuation / Total Units
 * @param {string} updatedBy - User ID who triggered the NAV update
 * @returns {Promise<Object>} Updated NAV record
 */
export async function calculateAndUpdateNAV(updatedBy) {
  try {
    await dbConnect()

    // Get current value from database
    const currentValueDoc = await CurrentValue.getCurrentValue()
    const currentValue = currentValueDoc || 0
    
    // Get portfolio totals for units
    const portfolioTotals = await PortfolioTotals.findOne()
    if (!portfolioTotals) {
      console.log('No portfolio totals found')
      return null
    }
    
    const totalUnits = portfolioTotals.totalUnits

    if (totalUnits === 0) {
      console.log('No units found, skipping NAV calculation')
      return null
    }

    // Calculate new NAV
    const newNAV = currentValue / totalUnits

    // Check if NAV already exists for today (using date range for daily uniqueness)
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
    
    const existingNAV = await NAV.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })

    let navRecord
    if (existingNAV) {
      // Update existing NAV for today with current timestamp
      existingNAV.value = newNAV
      existingNAV.date = new Date() // Store full timestamp
      existingNAV.updatedBy = updatedBy
      navRecord = await existingNAV.save()
    } else {
      // Create new NAV record with current timestamp
      navRecord = await NAV.create({
        date: new Date(), // Store full timestamp instead of midnight
        value: newNAV,
        updatedBy: updatedBy
      })
    }

    console.log(`NAV updated: ${newNAV.toFixed(4)} (Current Value: ${currentValue.toFixed(2)}, Total Units: ${totalUnits.toFixed(2)})`)
    
    return navRecord
  } catch (error) {
    console.error('Error calculating and updating NAV:', error)
    throw error
  }
}

/**
 * Get current NAV value
 * @returns {Promise<number>} Current NAV value
 */
export async function getCurrentNAV() {
  try {
    await dbConnect()
    const latestNAV = await NAV.findOne().sort({ date: -1 })
    return latestNAV ? latestNAV.value : 10 // Default NAV of 10
  } catch (error) {
    console.error('Error getting current NAV:', error)
    return 10 // Default fallback
  }
}

/**
 * Check if NAV should be recalculated based on stock sale
 * @param {Object} holding - The holding that was updated
 * @returns {boolean} Whether NAV should be recalculated
 */
export function shouldRecalculateNAV(holding) {
  // Recalculate NAV when:
  // 1. A holding is completely sold (status changed to 'sold')
  // 2. A partial sale occurred (remainingUnits changed)
  return holding.status === 'sold' || holding.isModified('remainingUnits')
}

export default {
  calculateAndUpdateNAV,
  getCurrentNAV,
  shouldRecalculateNAV
}