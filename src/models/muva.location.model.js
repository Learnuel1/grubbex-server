const { model } = require("mongoose");
const { Schema } = require("mongoose");

const MuvaLocationSchema = new Schema({
  muva: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Muva ID is required"],
    indexed: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "User ID is required"],
    indexed: true
  },
  bookId: {
    type: String,
    ref: "Account",
    required: [true, "Booking ID is required"],
    indexed: true
  },
  location: {
    type: [],
    required: true,
  },
},{timestamps: true}
);
const MuvaLocationModel = model("Muvalocation", MuvaLocationSchema);
module.exports = MuvaLocationModel;