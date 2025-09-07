import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import PortfolioTotals from '../../../models/PortfolioTotals'
import Trade from '../../../models/Trade'
import { verifyToken, getTokenFromRequest } from '../../../utils/auth'

export async function GET(request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get portfolio totals
    let portfolioTotals = await PortfolioTotals.findOne({})
    
    // If no document exists, create one with default values
    if (!portfolioTotals) {
      portfolioTotals = new PortfolioTotals({
        totalUnits: 0,
        totalInvestment: 0
      })
      await portfolioTotals.save()
    }

    // Calculate total profit/loss from all trades
    const allTrades = await Trade.find({})
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

    return NextResponse.json({
      success: true,
      data: {
        totalUnits: portfolioTotals.totalUnits || 0,
        totalInvestment: (portfolioTotals.totalInvestment || 0) + totalProfitLoss, // Include profit/loss
        totalProfitLoss, // Add profit/loss as separate field
        lastUpdated: portfolioTotals.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching portfolio totals:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}