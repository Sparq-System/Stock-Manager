import mongoose from 'mongoose';

const TotalUnitsSchema = new mongoose.Schema({
  totalUnits: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

const TotalUnits = mongoose.models.TotalUnits || mongoose.model('TotalUnits', TotalUnitsSchema);

export default TotalUnits;