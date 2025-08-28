import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Trade from '../../../models/Trade'
import { verifyToken, getTokenFromRequest } from '../../../utils/auth'

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
    await trade.populate('userId', 'firstName lastName email')

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

    await Trade.findByIdAndDelete(tradeId)

    return NextResponse.json({ message: 'Trade deleted successfully' })
  } catch (error) {
    console.error('Delete trade error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}