const { Schema, model } = require("mongoose");

const WalletSchema = new Schema({
  balance: {
    type: Number,
    required: [true, "Wallet balance is required"],
    default: 0,
    min: 0,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Wallet User Id is required"],
    index: true,
    unique: true,
  },
  pendingBalance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  payoutDueDate: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });
 
const WalletModel = model("Wallet", WalletSchema)
module.exports = {
  WalletModel,
}