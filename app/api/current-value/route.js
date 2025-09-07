import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import CurrentValue from '../../../models/CurrentValue'
import jwt from 'jsonwebtoken'

export async function GET(request) {
  try {
    await dbConnect()
    
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current value from database
    const currentValue = await CurrentValue.getCurrentValue()
    
    return NextResponse.json({
      success: true,
      currentValue: currentValue
    })
  } catch (error) {
    console.error('Error fetching current value:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current value' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { action, amount, description } = await request.json()
    
    let newValue
    
    switch (action) {
      case 'initialize':
        // Initialize current value based on existing portfolio data
        const PortfolioTotals = (await import('../../../models/PortfolioTotals')).default
        const Trade = (await import('../../../models/Trade')).default
        
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
        const calculatedValue = totalInvestment + totalProfitLoss
        
        newValue = await CurrentValue.updateCurrentValue(
          calculatedValue,
          'manual',
          'Initialized current value based on existing portfolio data'
        )
        
        return NextResponse.json({
          success: true,
          currentValue: newValue,
          message: 'Current value initialized successfully',
          details: {
            totalInvestment,
            totalProfitLoss,
            calculatedValue
          }
        })
        
      case 'add':
        if (!amount) {
          return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
        }
        newValue = await CurrentValue.addToCurrentValue(
          parseFloat(amount),
          'investment',
          description || 'Investment added'
        )
        break
      case 'subtract':
        if (!amount) {
          return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
        }
        newValue = await CurrentValue.subtractFromCurrentValue(
          parseFloat(amount),
          'withdrawal',
          description || 'Withdrawal made'
        )
        break
      case 'set':
        if (!amount) {
          return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
        }
        newValue = await CurrentValue.updateCurrentValue(
          parseFloat(amount),
          'manual',
          description || 'Manual update'
        )
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      currentValue: newValue,
      message: `Current value ${action}ed successfully`
    })
  } catch (error) {
    console.error('Error updating current value:', error)
    return NextResponse.json(
      { error: 'Failed to update current value' },
      { status: 500 }
    )
  }
}