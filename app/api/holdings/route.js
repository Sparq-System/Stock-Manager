import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import Holding from '../../../models/Holding'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function GET(request) {
  try {
    await dbConnect()
    
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if we should fetch all holdings (including sold ones)
    const url = new URL(request.url)
    const fetchAll = url.searchParams.get('all') === 'true'

    let holdings
    if (user.role === 'admin') {
      if (fetchAll) {
        // Fetch all holdings (active, partial, and sold) for admin users
        holdings = await Holding.find({})
          .populate('userId', 'firstName lastName email userCode')
          .sort({ lastTransactionDate: -1 })
      } else {
        // Fetch only active holdings for admin users
        holdings = await Holding.find({
          remainingUnits: { $gt: 0 },
          status: 'active'
        }).populate('userId', 'firstName lastName email userCode').sort({ lastTransactionDate: -1 })
      }
    } else {
      if (fetchAll) {
        // Fetch all holdings for current user
        holdings = await Holding.find({
          userId: decoded.userId
        }).populate('userId', 'firstName lastName email userCode').sort({ lastTransactionDate: -1 })
      } else {
        // Fetch only current user's active holdings
        holdings = await Holding.find({
          userId: decoded.userId,
          remainingUnits: { $gt: 0 },
          status: 'active'
        }).populate('userId', 'firstName lastName email userCode').sort({ lastTransactionDate: -1 })
      }
    }

    // Format holdings data for frontend
    const formattedHoldings = holdings.map(holding => ({
      _id: holding._id,
      stockName: holding.stockName,
      totalUnitsPurchased: holding.totalUnitsPurchased,
      totalUnitsSold: holding.totalUnitsSold,
      remainingUnits: holding.remainingUnits,
      avgPrice: holding.avgPrice,
      totalInvestment: holding.totalInvestment,
      totalRealized: holding.totalRealized,
      purchaseDate: holding.purchaseDate,
      lastTransactionDate: holding.lastTransactionDate,
      realizedPL: holding.realizedPL,
      unrealizedPL: holding.unrealizedPL,
      transactions: holding.transactions,
      user: {
        _id: holding.userId._id,
        name: `${holding.userId.firstName} ${holding.userId.lastName}`,
        email: holding.userId.email,
        userCode: holding.userId.userCode
      }
    }))

    return NextResponse.json({ 
      holdings: formattedHoldings,
      totalHoldings: formattedHoldings.length
    }, { status: 200 })

  } catch (error) {
    console.error('Holdings API Error:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}