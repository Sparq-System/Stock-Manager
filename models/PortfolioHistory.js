import mongoose from 'mongoose'

const PortfolioHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  investedAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  currentValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalUnits: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  navValue: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  returns: {
    type: Number,
    default: 0
  },
  returnsPercentage: {
    type: Number,
    default: 0
  },
  updatedBy: {
    type: String,
    enum: ['investment', 'withdrawal', 'nav_update', 'manual', 'system'],
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

// Compound index for efficient date-based queries
PortfolioHistorySchema.index({ date: -1, createdAt: -1 })

// Virtual for calculating returns
PortfolioHistorySchema.virtual('calculatedReturns').get(function() {
  return this.currentValue - this.investedAmount
})

// Virtual for calculating returns percentage
PortfolioHistorySchema.virtual('calculatedReturnsPercentage').get(function() {
  if (this.investedAmount === 0) return 0
  return ((this.currentValue - this.investedAmount) / this.investedAmount) * 100
})

// Static method to get latest portfolio snapshot
PortfolioHistorySchema.statics.getLatestSnapshot = async function() {
  return await this.findOne().sort({ date: -1, createdAt: -1 })
}

// Static method to get historical data for a date range
PortfolioHistorySchema.statics.getHistoricalData = async function(startDate, endDate, limit = 100) {
  const query = {}
  if (startDate) query.date = { $gte: new Date(startDate) }
  if (endDate) {
    query.date = query.date || {}
    query.date.$lte = new Date(endDate)
  }
  
  return await this.find(query)
    .sort({ date: 1 })
    .limit(limit)
}

// Static method to create or update daily snapshot
PortfolioHistorySchema.statics.createDailySnapshot = async function(data) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if snapshot for today already exists
  const existingSnapshot = await this.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  })
  
  const snapshotData = {
    date: today,
    investedAmount: data.investedAmount,
    currentValue: data.currentValue,
    totalUnits: data.totalUnits,
    navValue: data.navValue,
    returns: data.currentValue - data.investedAmount,
    returnsPercentage: data.investedAmount > 0 ? ((data.currentValue - data.investedAmount) / data.investedAmount) * 100 : 0,
    updatedBy: data.updatedBy || 'system',
    description: data.description || 'Daily portfolio snapshot'
  }
  
  if (existingSnapshot) {
    // Update existing snapshot
    Object.assign(existingSnapshot, snapshotData)
    return await existingSnapshot.save()
  } else {
    // Create new snapshot
    return await this.create(snapshotData)
  }
}

export default mongoose.models.PortfolioHistory || mongoose.model('PortfolioHistory', PortfolioHistorySchema)