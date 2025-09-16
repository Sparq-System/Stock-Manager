import mongoose from 'mongoose'

const NAVSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['daily_calculation', 'stock_sale', 'investment', 'withdrawal', 'manual'],
    default: 'daily_calculation'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'navs'
})

const NAV = mongoose.models.NAV || mongoose.model('NAV', NAVSchema)

export default NAV