import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Trade from '../../../models/Trade'
import Holding from '../../../models/Holding'
import { verifyToken, getTokenFromRequest } from '../../../utils/auth'
import { addUnits, subtractUnits, calculateUnitsFromInvestment } from '../../../utils/unitManager'
import { calculateAndUpdateNAV, shouldRecalculateNAV } from '../../../utils/navCalculator'

// Helper function to update or create holding
async function recalculateHoldingAfterDeletion(userId, stockName) {
  try {
    // Get all remaining trades for this user and stock
    const remainingTrades = await Trade.find({
      userId: userId,
      stockName: stockName
    }).sort({ purchaseDate: 1 })

    // Find existing active holding
    const existingHolding = await Holding.findOne({
      userId: userId,
      stockName: stockName,
      status: 'active'
    })

    if (remainingTrades.length === 0) {
      // No more trades, delete the holding
      if (existingHolding) {
        await Holding.findByIdAndDelete(existingHolding._id)
      }
      return
    }

    // Recalculate holding based on remaining trades
    let totalUnits = 0
    let totalInvestment = 0
    let totalSold = 0
    let totalRealized = 0
    const transactions = []

    for (const trade of remainingTrades) {
      totalUnits += trade.unitsPurchased
      totalInvestment += trade.unitsPurchased * trade.purchaseRate
      
      transactions.push({
        type: 'buy',
        units: trade.unitsPurchased,
        rate: trade.purchaseRate,
        date: trade.purchaseDate,
        tradeId: trade._id
      })

      if (trade.unitsSold > 0) {
        totalSold += trade.unitsSold
        totalRealized += trade.unitsSold * trade.sellingPrice
        
        transactions.push({
          type: 'sell',
          units: trade.unitsSold,
          rate: trade.sellingPrice,
          date: trade.sellingDate,
          tradeId: trade._id
        })
      }
    }

    const remainingUnits = totalUnits - totalSold
    const averagePrice = remainingUnits > 0 ? totalInvestment / totalUnits : 0
    const status = remainingUnits > 0 ? 'active' : 'sold'

    if (existingHolding) {
      // Update existing holding
      existingHolding.totalUnits = totalUnits
      existingHolding.remainingUnits = remainingUnits
      existingHolding.averagePrice = averagePrice
      existingHolding.totalInvestment = totalInvestment
      existingHolding.totalRealized = totalRealized
      existingHolding.status = status
      existingHolding.transactions = transactions
      existingHolding.updatedAt = new Date()
      await existingHolding.save()
      
      // Trigger NAV recalculation if needed
      try {
        if (shouldRecalculateNAV(existingHolding)) {
          await calculateAndUpdateNAV(userId)
          console.log('NAV updated after holding recalculation')
        }
      } catch (navError) {
        console.error('Error updating NAV after holding recalculation:', navError)
      }
    } else if (remainingUnits > 0) {
      // Create new holding if units remain
      const newHolding = await Holding.create({
        userId: userId,
        stockName: stockName,
        totalUnits: totalUnits,
        remainingUnits: remainingUnits,
        averagePrice: averagePrice,
        totalInvestment: totalInvestment,
        totalRealized: totalRealized,
        status: status,
        transactions: transactions
      })
      
      // Trigger NAV recalculation for new holding
      try {
        if (shouldRecalculateNAV(newHolding)) {
          await calculateAndUpdateNAV(userId)
          console.log('NAV updated after new holding creation')
        }
      } catch (navError) {
        console.error('Error updating NAV after new holding creation:', navError)
      }
    }
  } catch (error) {
    console.error('Error recalculating holding after deletion:', error)
    throw error
  }
}

async function updateHolding(tradeData) {
  const { userId, stockName, purchaseRate, purchaseDate, unitsPurchased, sellingPrice, sellingDate, unitsSold } = tradeData

  // Find existing active holding for this user and stock
  let holding = await Holding.findOne({ userId, stockName, status: 'active' })

  if (holding) {
    // Update existing holding
    const newTotalUnitsPurchased = holding.totalUnitsPurchased + unitsPurchased
    const newTotalInvestment = holding.totalInvestment + (unitsPurchased * purchaseRate)
    const newAvgPrice = newTotalInvestment / newTotalUnitsPurchased
    
    holding.totalUnitsPurchased = newTotalUnitsPurchased
    holding.totalInvestment = newTotalInvestment
    holding.avgPrice = newAvgPrice
    holding.lastTransactionDate = new Date()
    
    // Handle selling if provided
    if (sellingPrice && sellingDate && unitsSold > 0) {
      holding.totalUnitsSold += unitsSold
      holding.totalRealized += (unitsSold * sellingPrice)
    }
    
    // Calculate remaining units
    holding.remainingUnits = holding.totalUnitsPurchased - holding.totalUnitsSold
    
    // Update status
    holding.status = holding.remainingUnits > 0 ? 'active' : 'sold'
    
    // Add transaction record
    holding.transactions.push({
      type: 'buy',
      units: unitsPurchased,
      price: purchaseRate,
      date: purchaseDate,
      amount: unitsPurchased * purchaseRate
    })
    
    if (sellingPrice && sellingDate && unitsSold > 0) {
      holding.transactions.push({
        type: 'sell',
        units: unitsSold,
        price: sellingPrice,
        date: sellingDate,
        amount: unitsSold * sellingPrice
      })
    }
    
    await holding.save()
  } else {
    // Create new holding
    const totalRealized = (sellingPrice && sellingDate && unitsSold > 0) ? (unitsSold * sellingPrice) : 0
    const totalUnitsSold = unitsSold || 0
    const remainingUnits = unitsPurchased - totalUnitsSold
    
    const transactions = [{
      type: 'buy',
      units: unitsPurchased,
      price: purchaseRate,
      date: purchaseDate,
      amount: unitsPurchased * purchaseRate
    }]
    
    if (sellingPrice && sellingDate && unitsSold > 0) {
      transactions.push({
        type: 'sell',
        units: unitsSold,
        price: sellingPrice,
        date: sellingDate,
        amount: unitsSold * sellingPrice
      })
    }
    
    holding = new Holding({
      userId,
      stockName,
      totalUnitsPurchased: unitsPurchased,
      totalUnitsSold,
      remainingUnits,
      avgPrice: purchaseRate,
      totalInvestment: unitsPurchased * purchaseRate,
      totalRealized,
      purchaseDate,
      lastTransactionDate: new Date(),
      status: remainingUnits > 0 ? 'active' : 'sold',
      transactions
    })
    
    await holding.save()
  }
  
  // Trigger NAV recalculation if needed
  try {
    if (shouldRecalculateNAV(holding)) {
      await calculateAndUpdateNAV(userId)
      console.log('NAV updated after holding update')
    }
  } catch (navError) {
    console.error('Error updating NAV after holding update:', navError)
  }
}

export async function GET(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all')

    let trades
    if (all && decoded.role === 'admin') {
      trades = await Trade.find({}).populate('userId', 'firstName lastName email')
    } else {
      trades = await Trade.find({ userId: decoded.userId })
    }

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Get trades error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const {
      userId,
      stockName,
      purchaseRate,
      purchaseDate,
      unitsPurchased,
      sellingPrice,
      sellingDate,
      unitsSold
    } = await request.json()

    if (!userId || !stockName || !purchaseRate || !purchaseDate || !unitsPurchased) {
      return NextResponse.json(
        { message: 'Required fields: userId, stockName, purchaseRate, purchaseDate, unitsPurchased' },
        { status: 400 }
      )
    }

    let status = 'active'
    if (sellingPrice && sellingDate && unitsSold) {
      if (unitsSold === unitsPurchased) {
        status = 'sold'
      } else if (unitsSold > 0) {
        status = 'partial'
      }
    }

    const trade = new Trade({
      userId,
      stockName,
      purchaseRate,
      purchaseDate: new Date(purchaseDate),
      unitsPurchased,
      sellingPrice: sellingPrice || null,
      sellingDate: sellingDate ? new Date(sellingDate) : null,
      unitsSold: unitsSold || 0,
      status
    })

    await trade.save()

    // Note: We don't update user's investedAmount for trades as this represents
    // active trading within existing investment, not new investment
    // The total investment should remain constant while only invested in trades changes

    // Update or create holding
    await updateHolding({
      userId,
      stockName,
      purchaseRate: parseFloat(purchaseRate),
      purchaseDate: new Date(purchaseDate),
      unitsPurchased: parseInt(unitsPurchased),
      sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
      sellingDate: sellingDate ? new Date(sellingDate) : null,
      unitsSold: unitsSold ? parseInt(unitsSold) : 0
    })

    return NextResponse.json({
      message: 'Trade created successfully',
      trade
    })
  } catch (error) {
    console.error('Create trade error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const {
      tradeId,
      stockName,
      purchaseRate,
      purchaseDate,
      unitsPurchased,
      sellingPrice,
      sellingDate,
      unitsSold
    } = await request.json()

    if (!tradeId) {
      return NextResponse.json({ message: 'Trade ID is required' }, { status: 400 })
    }

    const trade = await Trade.findById(tradeId)
    if (!trade) {
      return NextResponse.json({ message: 'Trade not found' }, { status: 404 })
    }

    trade.stockName = stockName || trade.stockName
    trade.purchaseRate = purchaseRate || trade.purchaseRate
    trade.purchaseDate = purchaseDate ? new Date(purchaseDate) : trade.purchaseDate
    trade.unitsPurchased = unitsPurchased || trade.unitsPurchased
    trade.sellingPrice = sellingPrice !== undefined ? sellingPrice : trade.sellingPrice
    trade.sellingDate = sellingDate ? new Date(sellingDate) : trade.sellingDate
    trade.unitsSold = unitsSold !== undefined ? unitsSold : trade.unitsSold

    // Update status based on selling information
    if (trade.sellingPrice && trade.sellingDate && trade.unitsSold > 0) {
      if (trade.unitsSold === trade.unitsPurchased) {
        trade.status = 'sold'
      } else {
        trade.status = 'partial'
      }
    } else {
      trade.status = 'active'
    }

    await trade.save()
    await trade.populate('userId', 'firstName lastName email')

    // Update holdings collection to reflect the trade changes
    await updateHolding({
      userId: trade.userId._id,
      stockName: trade.stockName,
      purchaseRate: trade.purchaseRate,
      purchaseDate: trade.purchaseDate,
      unitsPurchased: trade.unitsPurchased,
      sellingPrice: trade.sellingPrice,
      sellingDate: trade.sellingDate,
      unitsSold: trade.unitsSold,
      status: trade.status
    })

    return NextResponse.json({
      message: 'Trade updated successfully',
      trade
    })
  } catch (error) {
    console.error('Update trade error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    await dbConnect()
    
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tradeId = searchParams.get('tradeId')

    if (!tradeId) {
      return NextResponse.json({ message: 'Trade ID is required' }, { status: 400 })
    }

    const trade = await Trade.findById(tradeId)
    if (!trade) {
      return NextResponse.json({ message: 'Trade not found' }, { status: 404 })
    }

    // Store trade info before deletion for holdings recalculation
    const { userId, stockName } = trade

    await Trade.findByIdAndDelete(tradeId)

    // Recalculate holdings after trade deletion
    await recalculateHoldingAfterDeletion(userId, stockName)

    return NextResponse.json({ message: 'Trade deleted successfully' })
  } catch (error) {
    console.error('Delete trade error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}