const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const TemporalAccountSchema = new Schema({
  email: {
    type: String, 
    trim: true,
    index: true,  
    sparse: true,
  },
  user: {
    type: Schema.Types.ObjectId, 
    ref: "Account",
    index: true,
    sparse: true, 
  },
  type: {
    type: String,
    enum:  CONSTANTS.ACCOUNT_TYPE,
    required: true,
  },
  phone: {
    type: String,
    trim: true,
    index: true, 
  },
  refreshToken: {
    type: String,  
    index: true,
    required:true,
  },
  
  otp: {
    type: String,
    index: true,
    trim: true,
    required: true,
  },
  isOTP: {
    type: String,
    enum: ["checked", "unchecked", "none"],
    default: "none"
  }
},
{timestamps: true}
);

const TemporalAccountModel = model("TemporalAccount", TemporalAccountSchema);

module.exports = TemporalAccountModel;