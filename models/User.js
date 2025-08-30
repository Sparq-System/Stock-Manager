import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'client'],
    default: 'client'
  },
  dateOfJoining: {
    type: Date,
    default: Date.now
  },
  userCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    length: 6
  },
  investedAmount: {
    type: Number,
    default: 0
  },
  units: {
    type: Number,
    default: 0
  }
  // currentValue is now calculated dynamically as units * NAV
}, {
  timestamps: true
})

export default mongoose.models.User || mongoose.model('User', UserSchema)