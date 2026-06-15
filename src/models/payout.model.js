const {Schema, Types, model} = require('mongoose');
const { CONSTANTS } = require('../config');

const payoutSchema = new Schema({
  id: String,
  accountType: {
    type: String,
    enum: CONSTANTS.ACCOUNT_TYPE,
  },
  amount: Number,
  status: {
    type: String,
    enum: Array.from(CONSTANTS.PAYOUT_STATUS),
    default: CONSTANTS.PAYOUT_STATUS.pending
  },
  account: {
    type:  Types.ObjectId,
    ref: 'Account'
  },
  store: {
    type: Types.ObjectId,
    ref: 'Store'
  },
  storeId: String,
  storeName: String,
  paidBy: Object,
  paidDate: Date,
  method: String,
  bankDetails: Object, 
}, {timestamps: true});

const PayoutModel = model('Payout', payoutSchema);
module.exports = PayoutModel;
