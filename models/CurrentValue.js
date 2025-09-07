import mongoose from 'mongoose';

const CurrentValueSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    enum: ['investment', 'withdrawal', 'trade_completion', 'manual', 'stock_sale_profit'],
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Ensure only one document exists (singleton pattern)
CurrentValueSchema.index({}, { unique: true });

// Static method to get current value
CurrentValueSchema.statics.getCurrentValue = async function() {
  let currentValue = await this.findOne();
  if (!currentValue) {
    // Initialize with 0 if no record exists
    currentValue = await this.create({
      value: 0,
      updatedBy: 'manual',
      description: 'Initial value'
    });
  }
  return currentValue.value;
};

// Static method to update current value
CurrentValueSchema.statics.updateCurrentValue = async function(newValue, updatedBy, description = '') {
  let currentValue = await this.findOne();
  if (!currentValue) {
    // Create new record if none exists
    currentValue = await this.create({
      value: newValue,
      updatedBy,
      description
    });
  } else {
    // Update existing record
    currentValue.value = newValue;
    currentValue.updatedBy = updatedBy;
    currentValue.description = description;
    currentValue.lastUpdated = new Date();
    await currentValue.save();
  }
  return currentValue.value;
};

// Static method to add to current value
CurrentValueSchema.statics.addToCurrentValue = async function(amount, updatedBy, description = '') {
  const currentVal = await this.getCurrentValue();
  const newValue = Math.max(0, currentVal + amount); // Ensure value doesn't go below 0
  return await this.updateCurrentValue(newValue, updatedBy, description);
};

// Static method to subtract from current value
CurrentValueSchema.statics.subtractFromCurrentValue = async function(amount, updatedBy, description = '') {
  const currentVal = await this.getCurrentValue();
  const newValue = Math.max(0, currentVal - amount); // Ensure value doesn't go below 0
  return await this.updateCurrentValue(newValue, updatedBy, description);
};

const CurrentValue = mongoose.models.CurrentValue || mongoose.model('CurrentValue', CurrentValueSchema);

export default CurrentValue;