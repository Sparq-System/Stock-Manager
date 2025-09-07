import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '../../../../lib/mongodb.js'
import Stock from '../../../../models/Stock.js'

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

// GET - Search stocks by name or symbol for autocomplete
export async function GET(request) {
  try {
    await dbConnect()
    
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit')) || 10
    
    if (!query || query.trim().length < 1) {
      return NextResponse.json({ message: 'Search query is required' }, { status: 400 })
    }

    const searchQuery = query.trim()
    
    // Search stocks by symbol or company name (case-insensitive)
    const stocks = await Stock.find({
      $or: [
        { stockSymbol: { $regex: searchQuery, $options: 'i' } },
        { companyName: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('stockSymbol companyName serialNumber')
    .limit(limit)
    .lean()

    // Format the response for autocomplete
    const suggestions = stocks.map(stock => ({
      id: stock._id,
      symbol: stock.stockSymbol,
      name: stock.companyName,
      serialNumber: stock.serialNumber,
      displayText: `${stock.stockSymbol} - ${stock.companyName}`
    }))

    return NextResponse.json({ 
      query: searchQuery,
      suggestions,
      count: suggestions.length
    })

  } catch (error) {
    console.error('Stock search API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    )
  }
}