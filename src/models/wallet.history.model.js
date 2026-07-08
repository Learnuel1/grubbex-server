const mongoose = require('mongoose');
const { CONSTANTS } = require('../config');
const { Schema, model } = mongoose;

const WalletHistorySchema = new Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  type: {
    type: String,
    enum: Array.from(Object.values(CONSTANTS.TRANSACTION_TYPE)),
    required: true,
  },
  credit: {
  type: Number,
  default: 0,
  min: 0,
},
debit: {
  type: Number,
  default: 0,
  min: 0,
},
  currency: {
    type: String,
    default: 'NGN',
    uppercase: true,
    enum: ['NGN'],
  },
  status: {
    type: String,
    enum: Array.from(Object.values(CONSTANTS.ORDER_PAYMENT_STATUS)),
    default: CONSTANTS.ORDER_PAYMENT_STATUS.pending,
    index: true,
  },

  // --- Wallet State (snapshot) ---
  balanceBefore: {
    type: Number, // User's balance BEFORE this transaction (in kobo)
    required: true,
  },
  balanceAfter: {
    type: Number, // User's balance AFTER this transaction (in kobo)
    required: true,
  },
 
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
  },
  orderId: {
    type: String, 
    index: true,
  },
  transferRecipient: {
    type: String, // Paystack recipient code, if it's a payout
  },
  metadata: {
    type: Schema.Types.Mixed, // Flexible field for Paystack response, extra info
    default: {},
  },

  // --- Tracking ---
  initiatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
  }, // For admin‑initiated transactions
  ipAddress: String,
  userAgent: String,

}, {
  timestamps: true,  
});

// --- Indexes for Performance ---
WalletHistorySchema.index({ user: 1, createdAt: -1 });
WalletHistorySchema.index({ orderId: 1, createdAt: -1 });
WalletHistorySchema.index({ status: 1, createdAt: -1 });
WalletHistorySchema.index({ reference: 1 }, { unique: true });
 
const WalletHistoryModel = model("WalletHistory", WalletHistorySchema)
module.exports = {
  WalletHistoryModel,
}