import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Stock from '../../../models/Stock'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // First, check if we have the stock data in our database
    const stockData = await Stock.findOne({ stockSymbol: symbol })
    
    if (stockData) {
      // Return stock data from local database
      console.log(`Using local database data for ${symbol}`)
      return NextResponse.json([{
        symbol: `${symbol}.NS`,
        image: stockData.image || null,
        companyName: stockData.companyName || symbol
      }])
    }

    // If stock not found in database, return default data
    console.log(`No local data found for ${symbol}, returning default data`)
    return NextResponse.json([{
      symbol: `${symbol}.NS`,
      image: null,
      companyName: symbol
    }])
    
  } catch (error) {
    console.error('Error fetching stock profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock profile' },
      { status: 500 }
    )
  }
}