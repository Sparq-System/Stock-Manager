import mongoose from 'mongoose'

const TradeSchema = new mongoose.Schema({
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
  purchaseRate: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  unitsPurchased: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    default: null
  },
  sellingDate: {
    type: Date,
    default: null
  },
  unitsSold: {
    type: Number,
    default: 0
  },
  partialProfitLoss: {
    type: Number,
    default: 0,
    comment: 'Cumulative profit/loss from partial sales'
  },
  finalProfitLoss: {
    type: Number,
    default: null,
    comment: 'Final profit/loss when trade is fully closed'
  },
  // Array to track individual partial sale transactions
  partialSales: [{
    unitsSold: {
      type: Number,
      required: true
    },
    sellingPrice: {
      type: Number,
      required: true
    },
    sellingDate: {
      type: Date,
      required: true
    },
    profitLoss: {
      type: Number,
      required: true
    },
    profitLossPercentage: {
      type: Number,
      required: true
    },
    transactionId: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'sold', 'partial'],
    default: 'active'
  }
}, {
  timestamps: true
})

TradeSchema.virtual('totalReturns').get(function() {
  if (this.sellingPrice && this.unitsSold > 0) {
    const invested = this.purchaseRate * this.unitsSold
    const returns = this.sellingPrice * this.unitsSold
    return returns - invested
  }
  return 0
})

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema)