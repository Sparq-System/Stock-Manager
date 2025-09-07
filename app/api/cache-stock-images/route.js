import { NextResponse } from 'next/server'
import dbConnect from '../../../lib/mongodb'
import Stock from '../../../models/Stock'

export async function POST(request) {
  try {
    await dbConnect()

    const apiKey = process.env.YOUR_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Find stocks without cached images
    const stocksWithoutImages = await Stock.find({
      $or: [
        { image: null },
        { image: { $exists: false } },
        { image: '' }
      ]
    }).limit(10) // Process 10 at a time to avoid hitting API limits

    if (stocksWithoutImages.length === 0) {
      return NextResponse.json({
        message: 'All stocks already have cached images',
        processed: 0
      })
    }

    let processed = 0
    let errors = []

    for (const stock of stocksWithoutImages) {
      try {
        // Fetch stock profile from Financial Modeling Prep API
        const url = `https://financialmodelingprep.com/stable/profile?symbol=${stock.stockSymbol}.NS&apikey=${apiKey}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          
          if (data && data.length > 0 && data[0].image) {
            // Update stock with image URL
            await Stock.findByIdAndUpdate(stock._id, {
              image: data[0].image
            })
            processed++
            console.log(`Cached image for ${stock.stockSymbol}: ${data[0].image}`)
          }
        } else {
          errors.push(`Failed to fetch data for ${stock.stockSymbol}: ${response.status}`)
        }
        
        // Add delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        errors.push(`Error processing ${stock.stockSymbol}: ${error.message}`)
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} stocks`,
      processed,
      errors: errors.length > 0 ? errors : undefined,
      remaining: await Stock.countDocuments({
        $or: [
          { image: null },
          { image: { $exists: false } },
          { image: '' }
        ]
      })
    })

  } catch (error) {
    console.error('Error caching stock images:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}