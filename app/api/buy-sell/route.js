import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import Trade from '../../../models/Trade'
import Holding from '../../../models/Holding'
import CurrentValue from '../../../models/CurrentValue'
import { addUnits, subtractUnits, calculateUnitsFromInvestment } from '../../../utils/unitManager'
import { calculateAndUpdateNAV, shouldRecalculateNAV } from '../../../utils/navCalculator'

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

// POST - Buy or Sell stocks
export async function POST(request) {
  try {
    await dbConnect()
    
    const decoded = verifyToken(request)
    if (!decoded) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { action, stockName, purchaseRate, purchaseDate, unitsPurchased, holdingId, sellingPrice, sellingDate, unitsSold } = body

    if (action === 'buy') {
      // Validate buy data
      if (!stockName || !purchaseRate || !purchaseDate || !unitsPurchased) {
        return NextResponse.json({ message: 'Missing required fields for buy operation' }, { status: 400 })
      }

      if (!Number.isInteger(unitsPurchased) || unitsPurchased <= 0) {
        return NextResponse.json({ message: 'Units purchased must be a positive whole number' }, { status: 400 })
      }

      // Create trade record
      const trade = new Trade({
        userId: decoded.userId,
        stockName: stockName.trim(),
        purchaseRate: parseFloat(purchaseRate),
        purchaseDate: new Date(purchaseDate),
        unitsPurchased: parseInt(unitsPurchased),
        status: 'active'
      })

      await trade.save()

      // Calculate and add units for the investment
      const investmentAmount = parseFloat(purchaseRate) * parseInt(unitsPurchased)
      const portfolioUnits = await calculateUnitsFromInvestment(investmentAmount)
      await addUnits(decoded.userId, portfolioUnits)

      // Update or create holding
      const existingHolding = await Holding.findOne({
        userId: decoded.userId,
        stockName: stockName.trim(),
        status: 'active'
      })

      if (existingHolding) {
        // Update existing active holding
        const newTotalUnits = existingHolding.totalUnitsPurchased + parseInt(unitsPurchased)
        const newTotalInvestment = existingHolding.totalInvestment + (parseFloat(purchaseRate) * parseInt(unitsPurchased))
        const newAvgPrice = newTotalInvestment / newTotalUnits

        existingHolding.totalUnitsPurchased = newTotalUnits
        existingHolding.remainingUnits = newTotalUnits - existingHolding.totalUnitsSold
        existingHolding.avgPrice = newAvgPrice
        existingHolding.totalInvestment = newTotalInvestment
        existingHolding.lastTransactionDate = new Date()
        
        // Add transaction record
        existingHolding.transactions.push({
          type: 'buy',
          units: parseInt(unitsPurchased),
          price: parseFloat(purchaseRate),
          date: new Date(purchaseDate),
          amount: parseFloat(purchaseRate) * parseInt(unitsPurchased)
        })

        await existingHolding.save()
      } else {
        // Create new holding (either first time or after previous holding was sold)
        const holding = new Holding({
          userId: decoded.userId,
          stockName: stockName.trim(),
          totalUnitsPurchased: parseInt(unitsPurchased),
          totalUnitsSold: 0,
          remainingUnits: parseInt(unitsPurchased),
          avgPrice: parseFloat(purchaseRate),
          totalInvestment: parseFloat(purchaseRate) * parseInt(unitsPurchased),
          totalRealized: 0,
          purchaseDate: new Date(purchaseDate),
          lastTransactionDate: new Date(),
          status: 'active',
          transactions: [{
            type: 'buy',
            units: parseInt(unitsPurchased),
            price: parseFloat(purchaseRate),
            date: new Date(purchaseDate),
            amount: parseFloat(purchaseRate) * parseInt(unitsPurchased)
          }]
        })

        await holding.save()
      }

      return NextResponse.json({ 
        message: 'Stock purchased successfully',
        trade: trade
      }, { status: 201 })

    } else if (action === 'sell') {
      // Validate sell data
      if (!holdingId || !sellingPrice || !sellingDate || !unitsSold) {
        return NextResponse.json({ message: 'Missing required fields for sell operation' }, { status: 400 })
      }

      if (!Number.isInteger(unitsSold) || unitsSold <= 0) {
        return NextResponse.json({ message: 'Units sold must be a positive whole number' }, { status: 400 })
      }

      // Find the active holding to sell
      const holding = await Holding.findById(holdingId)
      if (!holding) {
        return NextResponse.json({ message: 'Active holding not found for this stock' }, { status: 404 })
      }

      if (holding.status !== 'active') {
        return NextResponse.json({ message: 'Cannot sell from inactive holding' }, { status: 400 })
      }

      if (holding.userId.toString() !== decoded.userId) {
        return NextResponse.json({ message: 'Unauthorized access to holding' }, { status: 403 })
      }

      if (parseInt(unitsSold) > holding.remainingUnits) {
        return NextResponse.json({ message: 'Cannot sell more units than available' }, { status: 400 })
      }

      // Find and update existing active trades to mark units as sold
      const activeTrades = await Trade.find({
        userId: decoded.userId,
        stockName: holding.stockName,
        status: { $in: ['active', 'partial'] }
      }).sort({ purchaseDate: 1 }) // FIFO - sell oldest first
      
      let remainingUnitsToSell = parseInt(unitsSold)
      
      for (const trade of activeTrades) {
        if (remainingUnitsToSell <= 0) break
        
        const availableUnits = trade.unitsPurchased - (trade.unitsSold || 0)
        const unitsToSellFromThisTrade = Math.min(remainingUnitsToSell, availableUnits)
        
        if (unitsToSellFromThisTrade > 0) {
          trade.unitsSold = (trade.unitsSold || 0) + unitsToSellFromThisTrade
          trade.sellingPrice = parseFloat(sellingPrice)
          trade.sellingDate = new Date(sellingDate)
          
          // Calculate profit/loss for this partial sale
          const costBasis = trade.purchaseRate * unitsToSellFromThisTrade
          const saleProceeds = parseFloat(sellingPrice) * unitsToSellFromThisTrade
          const profitLoss = saleProceeds - costBasis
          const profitLossPercentage = (profitLoss / costBasis) * 100
          
          // Add this partial sale to the partialSales array
          const transactionId = `SALE_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
          trade.partialSales.push({
            unitsSold: unitsToSellFromThisTrade,
            sellingPrice: parseFloat(sellingPrice),
            sellingDate: new Date(sellingDate),
            profitLoss: profitLoss,
            profitLossPercentage: profitLossPercentage,
            transactionId: transactionId
          })
          
          // Update cumulative partial profit/loss
          trade.partialProfitLoss = (trade.partialProfitLoss || 0) + profitLoss
          
          // Update trade status
          if (trade.unitsSold === trade.unitsPurchased) {
            trade.status = 'sold'
            trade.finalProfitLoss = trade.partialProfitLoss
          } else {
            trade.status = 'partial'
          }
          
          await trade.save()
          remainingUnitsToSell -= unitsToSellFromThisTrade
        }
      }

      // Calculate profit/loss from this specific sale transaction
      const saleAmount = parseFloat(sellingPrice) * parseInt(unitsSold)
      const avgCostBasis = holding.avgPrice * parseInt(unitsSold)
      const transactionProfitLoss = saleAmount - avgCostBasis
      
      console.log(`Sale transaction profit/loss: ${transactionProfitLoss} (Sale: ${saleAmount}, Cost: ${avgCostBasis})`)
      
      // Immediately update CurrentValue with profit/loss from this partial sale
      if (transactionProfitLoss > 0) {
        await CurrentValue.addToCurrentValue(transactionProfitLoss, 'stock_sale_profit', `Profit of ₹${transactionProfitLoss.toFixed(2)} from selling ${unitsSold} units of ${holding.stockName} at ₹${sellingPrice} per unit`)
      } else if (transactionProfitLoss < 0) {
        await CurrentValue.subtractFromCurrentValue(Math.abs(transactionProfitLoss), 'stock_sale_loss', `Loss of ₹${Math.abs(transactionProfitLoss).toFixed(2)} from selling ${unitsSold} units of ${holding.stockName} at ₹${sellingPrice} per unit`)
      }
      
      // Update portfolio totals to reflect the change
      const { updatePortfolioTotalsFromAggregation } = await import('../../../utils/unitManager')
      await updatePortfolioTotalsFromAggregation()

      // Update holding
      holding.totalUnitsSold += parseInt(unitsSold)
      holding.remainingUnits -= parseInt(unitsSold)
      holding.totalRealized += parseFloat(sellingPrice) * parseInt(unitsSold)
      holding.lastTransactionDate = new Date()
      
      // Add transaction record
      holding.transactions.push({
        type: 'sell',
        units: parseInt(unitsSold),
        price: parseFloat(sellingPrice),
        date: new Date(sellingDate),
        amount: parseFloat(sellingPrice) * parseInt(unitsSold)
      })

      // Update status if fully sold
      if (holding.remainingUnits === 0) {
        holding.status = 'sold'
        console.log(`Holding ${holding.stockName} fully sold. Total realized: ₹${holding.totalRealized}, Total investment: ₹${holding.totalInvestment}`)
        // Note: Profit/loss is already accounted for in individual transactions above
      }

      await holding.save()

      // Always trigger NAV recalculation after any sale transaction
      try {
        const description = `Stock sale: ${unitsSold} units of ${holding.stockName} at ₹${sellingPrice} per unit (P/L: ₹${transactionProfitLoss.toFixed(2)})`
        await calculateAndUpdateNAV(decoded.userId, 'stock_sale', description)
        console.log('NAV updated after stock sale transaction')
      } catch (navError) {
        console.error('Error updating NAV after sale:', navError)
        // Don't fail the sale if NAV update fails
      }

      return NextResponse.json({ 
        message: 'Stock sold successfully',
        holding: holding
      }, { status: 200 })

    } else {
      return NextResponse.json({ message: 'Invalid action. Use "buy" or "sell"' }, { status: 400 })
    }

  } catch (error) {
    console.error('Buy/Sell API Error:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 })
  }
}