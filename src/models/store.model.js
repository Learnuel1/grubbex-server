const {Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const StoreSchema = new Schema({
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    maxLength: [15, 'Store ID must be 15 characters long'],
    minLength: [15, 'Store ID must be 15 characters long'],
    indexed: true,
    unique: [true, "Stored ID already exist"],
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Store name is required'],
    indexed: true,
    unique: [true, "Store name already exist"],
    trim: true,
  },
  category: {
    type: [ ]
  },
  like: {
    type: Number,
    default: 0,
    indexed: true,
  },
  rating: {
    type: Number,
    default: 0.0,
    indexed: true,
  },
  likers: [{
      type: Schema.Types.ObjectId,
      ref: "Like",
    }],
    raters: [{
      type: Schema.Types.ObjectId,
      ref: "Like",
    }],
  user:{
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, 'User is required']
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Review",
  }],
  address: [],
  location: {
    placeId: {
      type: String, 
    },
     latitude: {
      type: Number,
      indexed: true,
     },
     longitude: {
      type: Number,
      indexed: true,
     },
     formattedAddress: { type: String }
  },
  locationStatus: {
    type: String,
    required: true,
    enum: Array.from(Object.values(CONSTANTS.LOCATION_STATUS)),
    default: CONSTANTS.LOCATION_STATUS.unset,
  }
}, {timestamps: true}
);
const StoreModel = model("Store", StoreSchema);
module.exports = StoreModel;