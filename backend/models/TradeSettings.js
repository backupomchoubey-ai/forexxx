import mongoose from 'mongoose'

const tradeSettingsSchema = new mongoose.Schema({
  // Stop-out settings
  stopOutLevel: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  marginCallLevel: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  // Swap/Rollover time settings
  swapTime: {
    type: String,
    default: '17:00'
  },
  swapTimezone: {
    type: String,
    default: 'America/New_York'
  },
  tripleSwapDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: 'Wednesday'
  },
  // Trading hours
  tradingEnabled: {
    type: Boolean,
    default: true
  },
  tradingStartTime: {
    type: String,
    default: '00:00'
  },
  tradingEndTime: {
    type: String,
    default: '23:59'
  },
  // Risk settings
  maxLeverageGlobal: {
    type: Number,
    default: 500
  },
  maxOpenTradesPerUser: {
    type: Number,
    default: 100
  },
  maxOpenLotsPerUser: {
    type: Number,
    default: 100
  },
  // Default contract size
  defaultContractSize: {
    type: Number,
    default: 100000
  },
  // MT5 Feature Toggles
  enablePartialClose: {
    type: Boolean,
    default: true
  },
  enableTrailingStop: {
    type: Boolean,
    default: true
  },
  // Stop-out order: 'largest_margin' (MT5) or 'largest_loss' (MT4)
  stopOutOrder: {
    type: String,
    enum: ['largest_margin', 'largest_loss'],
    default: 'largest_margin'
  },
  // Include floating PnL in margin calculation (MT5 style)
  includeFloatingPnlInMargin: {
    type: Boolean,
    default: true
  },
  // Account type specific settings (optional override)
  accountTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountType',
    default: null
  },
  // Segment specific settings (optional override)
  segment: {
    type: String,
    enum: ['Forex', 'Crypto', 'Commodities', 'Indices', null],
    default: null
  },
  isGlobal: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Get settings for a specific context
tradeSettingsSchema.statics.getSettings = async function(accountTypeId = null, segment = null) {
  // Try to find specific settings first
  if (accountTypeId && segment) {
    const specific = await this.findOne({ accountTypeId, segment })
    if (specific) return specific
  }
  
  if (accountTypeId) {
    const byAccountType = await this.findOne({ accountTypeId, segment: null })
    if (byAccountType) return byAccountType
  }
  
  if (segment) {
    const bySegment = await this.findOne({ accountTypeId: null, segment })
    if (bySegment) return bySegment
  }
  
  // Return global settings
  let global = await this.findOne({ isGlobal: true })
  
  // Create default global settings if none exist
  if (!global) {
    global = await this.create({ isGlobal: true })
  }
  
  return global
}

export default mongoose.model('TradeSettings', tradeSettingsSchema)
