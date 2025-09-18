import dbConnect from '../lib/mongodb'
import NAV from '../models/NAV'
import Holding from '../models/Holding'
import PortfolioTotals from '../models/PortfolioTotals'
import CurrentValue from '../models/CurrentValue'

const updateNAV = async (userId, reason = 'daily_calculation', description = '') => {
  try {
    // Get current value
    const currentValue = await CurrentValue.findOne({ userId });
    if (!currentValue) {
      throw new Error('Current value not found for user');
    }

    // Create new NAV record for each change
    const nav = new NAV({
      date: new Date(),
      value: currentValue.currentValue,
      updatedBy: userId,
      reason: reason,
      description: description
    });

    await nav.save();
    return nav;
  } catch (error) {
    console.error('Error updating NAV:', error);
    throw error;
  }
};

/**
 * Calculate and update NAV automatically
 * NAV = Total Portfolio Valuation / Total Units
 * @param {string} updatedBy - User ID who triggered the NAV update
 * @param {string} reason - Reason for NAV update
 * @param {string} description - Description of the NAV change
 * @returns {Promise<Object>} Updated NAV record
 */
export async function calculateAndUpdateNAV(updatedBy, reason = 'daily_calculation', description = '') {
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

    // Always create new NAV record to track all changes
    const navRecord = await NAV.create({
      date: new Date(),
      value: newNAV,
      updatedBy: updatedBy,
      reason: reason,
      description: description
    })

    console.log(`NAV updated: ${newNAV.toFixed(4)} (Current Value: ${currentValue.toFixed(2)}, Total Units: ${totalUnits.toFixed(2)}) - Reason: ${reason}`)
    
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