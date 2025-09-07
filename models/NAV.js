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
    required: true
  }
}, {
  timestamps: true,
  collection: 'navs'
})

const NAV = mongoose.models.NAV || mongoose.model('NAV', NAVSchema)

export default NAV