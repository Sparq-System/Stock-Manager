import mongoose from 'mongoose'

const PortfolioMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  value: {
    type: Number,
    required: true
  },
  totalUnits: {
    type: Number,
    required: true,
    default: 0
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
})

export default mongoose.models.PortfolioMetrics || mongoose.model('PortfolioMetrics', PortfolioMetricsSchema)