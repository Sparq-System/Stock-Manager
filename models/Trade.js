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