import mongoose from 'mongoose'

const StockSchema = new mongoose.Schema({
  serialNumber: {
    type: Number,
    required: true,
    unique: true
  },
  stockSymbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  image: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
})

// Create text index for search functionality
StockSchema.index({ 
  stockSymbol: 'text', 
  companyName: 'text' 
}, {
  weights: {
    stockSymbol: 10,
    companyName: 5
  }
})

// Create compound index for efficient queries
StockSchema.index({ stockSymbol: 1, companyName: 1 })

export default mongoose.models.Stock || mongoose.model('Stock', StockSchema)