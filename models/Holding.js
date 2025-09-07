import mongoose from 'mongoose'

const HoldingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockName: {
    type: String,
    required: true,
    trim: true
  },
  totalUnitsPurchased: {
    type: Number,
    required: true,
    default: 0
  },
  totalUnitsSold: {
    type: Number,
    default: 0
  },
  remainingUnits: {
    type: Number,
    required: true
  },
  avgPrice: {
    type: Number,
    required: true
  },
  totalInvestment: {
    type: Number,
    required: true,
    default: 0
  },
  totalRealized: {
    type: Number,
    default: 0
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  lastTransactionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active'
  },
  transactions: [{
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    units: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
})

// Virtual for current profit/loss
HoldingSchema.virtual('unrealizedPL').get(function() {
  if (this.remainingUnits > 0) {
    // This would need current market price to calculate unrealized P&L
    // For now, return 0 as we don't have real-time prices
    return 0
  }
  return 0
})

// Virtual for realized profit/loss
HoldingSchema.virtual('realizedPL').get(function() {
  const sellTransactions = this.transactions.filter(t => t.type === 'sell')
  const buyTransactions = this.transactions.filter(t => t.type === 'buy')
  
  let totalSellAmount = sellTransactions.reduce((sum, t) => sum + t.amount, 0)
  let totalBuyAmount = buyTransactions.reduce((sum, t) => sum + t.amount, 0)
  
  // Calculate proportional buy cost for sold units
  if (this.totalUnitsSold > 0) {
    const avgBuyPrice = totalBuyAmount / this.totalUnitsPurchased
    const soldCost = avgBuyPrice * this.totalUnitsSold
    return totalSellAmount - soldCost
  }
  
  return 0
})

// Index for efficient queries
HoldingSchema.index({ userId: 1, stockName: 1 })
HoldingSchema.index({ userId: 1, status: 1 })

export default mongoose.models.Holding || mongoose.model('Holding', HoldingSchema)