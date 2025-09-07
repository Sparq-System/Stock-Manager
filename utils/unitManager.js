import dbConnect from '../lib/mongodb.js'
import User from '../models/User.js'
import NAV from '../models/NAV.js'
import PortfolioTotals from '../models/PortfolioTotals.js'

/**
 * Update user units and investment when investment is made
 * @param {string} userId - The user's ID
 * @param {number} unitsToAdd - Number of units to add
 * @param {number} investmentAmount - Investment amount to add
 */
export async function addUnits(userId, unitsToAdd, investmentAmount) {
  try {
    await dbConnect()
    
    console.log('Finding user with userId:', userId)
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    console.log('Current user units:', user.units, 'Adding:', unitsToAdd)
    console.log('Current user investment:', user.investedAmount, 'Adding:', investmentAmount)
    console.log('Types - unitsToAdd:', typeof unitsToAdd, 'investmentAmount:', typeof investmentAmount)
    
    const newUnits = (user.units || 0) + parseFloat(unitsToAdd)
    const newInvestment = (user.investedAmount || 0) + parseFloat(investmentAmount)
    
    // Use findByIdAndUpdate for atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        units: newUnits,
        investedAmount: newInvestment
      },
      { new: true }
    )
    
    console.log('Updated user units:', updatedUser.units)
    console.log('Updated user investment:', updatedUser.investedAmount)
    
    // Update portfolio totals aggregation
    await updatePortfolioTotalsFromAggregation()
    
    return updatedUser
  } catch (error) {
    console.error('Error adding units:', error)
    throw error
  }
}

/**
 * Update user units when withdrawal is made
 * @param {string} userId - The user's ID
 * @param {number} unitsToSubtract - Number of units to subtract
 * @param {number} withdrawalAmount - Withdrawal amount to subtract
 */
export async function subtractUnits(userId, unitsToSubtract, withdrawalAmount) {
  try {
    await dbConnect()
    
    console.log('Finding user with userId:', userId)
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    if (user.units < unitsToSubtract) {
      throw new Error('Insufficient units')
    }
    
    if (user.investedAmount < withdrawalAmount) {
      throw new Error('Insufficient invested amount')
    }
    
    console.log('Current user units:', user.units, 'Subtracting:', unitsToSubtract)
    console.log('Current user investment:', user.investedAmount, 'Subtracting:', withdrawalAmount)
    console.log('Types - unitsToSubtract:', typeof unitsToSubtract, 'withdrawalAmount:', typeof withdrawalAmount)
    
    const newUnits = user.units - parseFloat(unitsToSubtract)
    const newInvestment = user.investedAmount - parseFloat(withdrawalAmount)
    
    // Use findByIdAndUpdate for atomic operation
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        units: newUnits,
        investedAmount: newInvestment
      },
      { new: true }
    )
    
    console.log('Updated user units after subtraction:', updatedUser.units)
    console.log('Updated user investment after subtraction:', updatedUser.investedAmount)
    
    // Update portfolio totals aggregation
    await updatePortfolioTotalsFromAggregation()
    
    return updatedUser
  } catch (error) {
    console.error('Error subtracting units:', error)
    throw error
  }
}

/**
 * Calculate units based on investment amount and current NAV
 * @param {number} investmentAmount - Amount being invested
 * @param {number} currentNAV - Current NAV value (optional, will fetch latest if not provided)
 * @returns {Promise<number>} Number of units to be allocated
 */
export async function calculateUnitsFromInvestment(investmentAmount, currentNAV = null) {
  try {
    if (!currentNAV) {
      await dbConnect()
      const latestNAV = await NAV.findOne().sort({ date: -1 })
      currentNAV = latestNAV ? latestNAV.value : 10 // Default NAV of 10
    }
    
    return investmentAmount / currentNAV
  } catch (error) {
    console.error('Error calculating units from investment:', error)
    throw error
  }
}

/**
 * Calculate investment amount based on units and current NAV
 * @param {number} units - Number of units
 * @param {number} currentNAV - Current NAV value (optional, will fetch latest if not provided)
 * @returns {Promise<number>} Investment amount
 */
export async function calculateInvestmentFromUnits(units, currentNAV = null) {
  try {
    if (!currentNAV) {
      await dbConnect()
      const latestNAV = await NAV.findOne().sort({ date: -1 })
      currentNAV = latestNAV ? latestNAV.value : 10 // Default NAV of 10
    }
    
    return units * currentNAV
  } catch (error) {
    console.error('Error calculating investment from units:', error)
    throw error
  }
}

/**
 * Update PortfolioTotals collection with sum of all user units and investments
 */
export async function updatePortfolioTotalsFromAggregation() {
  try {
    await dbConnect()
    
    // Get all users and calculate totals manually
    const users = await User.find({}, 'units investedAmount')
    const totalUnits = users.reduce((sum, user) => sum + (user.units || 0), 0)
    const totalInvestment = users.reduce((sum, user) => sum + (user.investedAmount || 0), 0)

    console.log(`Calculated total units: ${totalUnits}`)
    console.log(`Calculated total investment: ${totalInvestment}`)

    // Update or create PortfolioTotals document
    await PortfolioTotals.findOneAndUpdate(
      {},
      { 
        totalUnits: totalUnits,
        totalInvestment: totalInvestment
      },
      { upsert: true, new: true }
    )

    console.log(`PortfolioTotals updated - Units: ${totalUnits}, Investment: ${totalInvestment}`)
  } catch (error) {
    console.error('Error updating portfolio totals from aggregation:', error)
    throw error
  }
}

/**
 * Legacy function for backward compatibility - now calls updatePortfolioTotalsFromAggregation
 */
export async function updateTotalUnitsFromAggregation() {
  return await updatePortfolioTotalsFromAggregation()
}