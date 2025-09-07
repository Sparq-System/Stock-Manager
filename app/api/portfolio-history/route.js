import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import PortfolioHistory from '../../../models/PortfolioHistory'
import User from '../../../models/User'
import CurrentValue from '../../../models/CurrentValue'
import NAV from '../../../models/NAV'
import { verifyToken } from '../../../utils/auth'

// GET - Fetch historical portfolio data
export async function GET(request) {
  try {
    await dbConnect()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1Y'
    const limit = parseInt(searchParams.get('limit')) || 100

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      case 'ALL':
        startDate.setFullYear(2020) // Set to a very early date
        break
      default:
        startDate.setFullYear(endDate.getFullYear() - 1)
    }

    // Fetch historical data
    const historicalData = await PortfolioHistory.getHistoricalData(startDate, endDate, limit)
    
    // If no historical data exists, create some sample data points
    if (historicalData.length === 0) {
      // Get current portfolio state
      const currentValue = await CurrentValue.getCurrentValue()
      const latestNav = await NAV.findOne().sort({ createdAt: -1 })
      const totalUsers = await User.countDocuments()
      
      // Calculate total invested amount from all users
      const users = await User.find({}, 'investedAmount')
      const totalInvested = users.reduce((sum, user) => sum + (user.investedAmount || 0), 0)
      
      // Generate sample historical data points
      const sampleData = []
      const dataPoints = Math.min(30, limit) // Generate up to 30 data points
      
      for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        // Simulate gradual growth in investment and value
        const progress = (dataPoints - i) / dataPoints
        const investedAmount = totalInvested * progress
        const portfolioValue = currentValue * progress * (0.8 + Math.random() * 0.4) // Add some variation
        
        sampleData.push({
          date: date,
          investedAmount: Math.round(investedAmount),
          currentValue: Math.round(portfolioValue),
          totalUnits: Math.round(progress * 1000), // Sample units
          navValue: latestNav?.value || 10,
          returns: Math.round(portfolioValue - investedAmount),
          returnsPercentage: investedAmount > 0 ? ((portfolioValue - investedAmount) / investedAmount) * 100 : 0
        })
      }
      
      return NextResponse.json({
        success: true,
        data: sampleData,
        period,
        message: 'Sample historical data generated'
      })
    }

    // Format the historical data for the chart
    const formattedData = historicalData.map(item => ({
      date: item.date,
      investedAmount: item.investedAmount,
      currentValue: item.currentValue,
      totalUnits: item.totalUnits,
      navValue: item.navValue,
      returns: item.returns,
      returnsPercentage: item.returnsPercentage
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      period,
      count: formattedData.length
    })

  } catch (error) {
    console.error('Error fetching portfolio history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update portfolio history snapshot
export async function POST(request) {
  try {
    await dbConnect()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only allow admin users to create snapshots
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { investedAmount, currentValue, totalUnits, navValue, description } = body

    if (typeof investedAmount !== 'number' || typeof currentValue !== 'number') {
      return NextResponse.json(
        { error: 'investedAmount and currentValue are required and must be numbers' },
        { status: 400 }
      )
    }

    // Create daily snapshot
    const snapshot = await PortfolioHistory.createDailySnapshot({
      investedAmount,
      currentValue,
      totalUnits: totalUnits || 0,
      navValue: navValue || 0,
      updatedBy: 'manual',
      description: description || 'Manual portfolio snapshot'
    })

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'Portfolio snapshot created successfully'
    })

  } catch (error) {
    console.error('Error creating portfolio snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create portfolio snapshot', details: error.message },
      { status: 500 }
    )
  }
}