import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase()
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userCode: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  units: {
    type: Number,
    default: 0
  },
  navValue: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['invest', 'withdraw'],
    lowercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  description: {
    type: String,
    default: ''
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedByName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for better search performance
TransactionSchema.index({ transactionId: 1 })
TransactionSchema.index({ userId: 1 })
TransactionSchema.index({ userCode: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ createdAt: -1 })
TransactionSchema.index({ amount: 1 })

// Compound indexes for common search patterns
TransactionSchema.index({ userId: 1, type: 1, createdAt: -1 })
TransactionSchema.index({ userCode: 1, type: 1, createdAt: -1 })

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema)