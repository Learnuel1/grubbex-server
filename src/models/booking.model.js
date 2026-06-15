const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const BookingSchema = new Schema({
  bookId: {
    type: String,
    trim: true,
    sparse: true,
    unique: true,
    indexed: true,
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: [true, "sender name is required"]
  },
  address: {
    type: String,
    trim: true,
    required: [true, "Sender address is required"],
    indexed: true,
    sparse: true,
  },
  phone: {
    type: String,
    trim: true,
    required: [true, "sender phone number is required"],
  },
  alternatePhone: {
    type: String,
    trim: true,
  }, 
  landMark: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true,
  },
  recipient: {
    type: [],
  },
  items: {
    type: [],
    required: [true, "Item Id is required"],
  },
  note: {
    type: String,
    trim: true,
  },
  images: {
    type: [],
  },
   
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "User ID is required"],
  },
  muva: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    indexed: true,
  },
  status: {
    type: String,
    required: true,
    default: CONSTANTS.BOOK_STATUS[0],
    enum: CONSTANTS.BOOK_STATUS,
  },
  paymentRef: {
    type: String,
    index: true,
    parse: true,
  },
  amount: {
    type: Number,
  },
  isAvailable: {
    type: Boolean,
    required: [true, "Booking availability status is required"],
    default: true,
  },
},
   {timestamps: true}
);
const BookingModel = model("Booking", BookingSchema);
module.exports = BookingModel;