import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import Trade from '../../../models/Trade'

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    await dbConnect()
    
    // Get user's total investment amount
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }
    
    const totalInvestment = user.investedAmount || 0
    
    // Calculate total amount invested in active trades (only remaining units)
    const activeTrades = await Trade.find({ 
      userId: decoded.userId,
      status: { $in: ['active', 'partial'] }
    })
    
    let investedInTrades = 0
    activeTrades.forEach(trade => {
      const remainingUnits = trade.unitsPurchased - (trade.unitsSold || 0)
      if (remainingUnits > 0) {
        // Only count the investment for remaining (unsold) units
        investedInTrades += trade.purchaseRate * remainingUnits
      }
    })
    
    // Calculate total profit/loss from all trades
    const allTrades = await Trade.find({ userId: decoded.userId })
    let totalProfitLoss = 0
    allTrades.forEach(trade => {
      // Add final profit/loss for fully sold trades
      if (trade.status === 'sold' && trade.finalProfitLoss) {
        totalProfitLoss += trade.finalProfitLoss
      }
      // Add partial profit/loss for partially sold trades
      if (trade.status === 'partial' && trade.partialProfitLoss) {
        totalProfitLoss += trade.partialProfitLoss
      }
    })
    
    console.log(`Total investment: ${totalInvestment}, Invested in trades: ${investedInTrades}, Total P&L: ${totalProfitLoss}, Active trades count: ${activeTrades.length}`)
    
    // Calculate remaining balance (total investment + profit/loss - invested in trades)
    const remainingBalance = totalInvestment + totalProfitLoss - investedInTrades
    
    return NextResponse.json({
      totalInvestment: totalInvestment + totalProfitLoss, // Include profit/loss in total investment
      investedInTrades,
      remainingBalance,
      totalProfitLoss // Add profit/loss as separate field for reference
    })
    
  } catch (error) {
    console.error('Investment balance API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}