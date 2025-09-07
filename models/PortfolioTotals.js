import mongoose from 'mongoose';

const PortfolioTotalsSchema = new mongoose.Schema({
  totalUnits: {
    type: Number,
    required: true,
    default: 0
  },
  totalInvestment: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const PortfolioTotals = mongoose.models.PortfolioTotals || mongoose.model('PortfolioTotals', PortfolioTotalsSchema);

export default PortfolioTotals;