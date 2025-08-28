import mongoose from 'mongoose'

const NAVSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  value: {
    type: Number,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
})

export default mongoose.models.NAV || mongoose.model('NAV', NAVSchema)