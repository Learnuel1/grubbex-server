const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const KYCSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    indexed: true,
  },
  userId:{
    type: String,
    required: true,
    unique: true,
    indexed: true
  },
  profile: {
    type: [],
  },
  bankDetails: {
    type: [],
  },
  documents: {
    type: [],
  },
  store: {
    type: [],
  },
  logistics: {
    type: [],
  },
  onBoarded: {
    type: Boolean,
    required: true,
    default: false,
    indexed: true,
  },
  tin: {
    type: String
  },
  location: {
    latitude: { 
      type: Number,
      indexed: true,
      default:0,
    },
    longitude: { 
      type: Number,
      indexed: true,
      default:0,
    },
    formattedAddress: { type: String }
  },
  rejection: [
     {
     kyc: { 
      type: String,
      enum: Array.from(Object.values(CONSTANTS.KYC_TYPE_INFO)),
    },
     name: {
        type: String,
        enum: Array.from(Object.values(CONSTANTS.KYC_TYPE_INFO)),
      },
      reason: {
        type: String,
        minlength: 10,
        maxlength: 500,
      }
  }
  ]
},
{timestamps: true}
);
const KYCModel = model("KYC", KYCSchema);
module.exports = {
  KYCModel,
}