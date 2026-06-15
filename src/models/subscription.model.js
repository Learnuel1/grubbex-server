const { Schema, model } = require("mongoose");

const SubscriptionSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: [true, "Subscription ID is required"]
  },
  email: {
    type: String,
    required: [true, "email is required"],
    indexed: true,
    unique: true
  },
  waitingList: {
    type: Boolean,
    required: true,
    default: false,
  },
  subscribe: {
    type: Boolean,
    required: true,
    default: false,
  }
}, {timestamps: true}
);

const SubscriptionModel = model("Subscription", SubscriptionSchema);
module.exports = SubscriptionModel;
