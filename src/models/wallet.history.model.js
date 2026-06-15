const { Schema, model } = require("mongoose");

const WalletHistorySchema = new Schema({
  balance: {
    type: Number,
    required: [true, "Wallet is required"],
    default: 0,
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
    default: 0,
  },
  description: {
    type: String,
    required: [true, "Activity description is required"],
  },
  credit: {
    type: Number,
    required: [true, "Amount is required"],
    default: 0,
  },
  debit: {
    type: Number,
    required: [true, "Amount is required"],
    default: 0,
  },
  transaction: {
    type: [],
    required: [true, "transaction info is required"],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Wallet User Id is required"],
    indexed: true,
    sparse: true,
  },
}, {timestamps: true}
);
const WalletHistoryModel = model("WalletHistory", WalletHistorySchema)
module.exports = {
  WalletHistoryModel,
}