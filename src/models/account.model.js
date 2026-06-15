const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");
const config = require("../config/env");
const { shortIdGen } = require("../shared/utils/Generator");

const AccountSchema = new Schema({
  userId:{
    type: String,
    indexed: true,
    unique: true,
    required: true
  },
  
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true, 
  },
  otherName: {
    type: String, 
    trim: true, 
  },
  email: {
    type: String,
    required: [true, "Email address is required"],
    trim: true,
    index: true,
    unique: true,
  },
  password:{
    type: String,
    required: [true, "Password is required"],
    index: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    unique: true,
     
  },
  status: {
    type: String,
    required: [true, "Account status is required"],
    enum: CONSTANTS.ACCOUNT_STATUS,
    default: CONSTANTS.ACCOUNT_STATUS[0],
  },
  refreshToken: {
    type: [String],  
    index: true,
  },
  type: {
    type: String,
    required: [true, "Account type is required"],
    enum: CONSTANTS.ACCOUNT_TYPE,
    index: true,
    default: CONSTANTS.ACCOUNT_TYPE[0],
  },
  role: {
    type: String,
    required: [true, "Account role is required"],
    enum: CONSTANTS.ACCOUNT_ROLE,
    index: true, 
  },
  picture:{
      id: {
        type: String,

      } ,
      url: {
        type: String
      } 
      },
    
  state: {
    type: String,
    required: true,
    enum: CONSTANTS.ACCOUNT_STATE,
    default: CONSTANTS.ACCOUNT_STATE_OBJ.active,
    index: true
  },
  verified:{
    type: Boolean,
    required: true,
    default: false,
    indexed: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0.00,
    },
    mFA: {
      type: Boolean,
      required: true,
      default: false,
    },
    countryCode: {
      type: String,
    },
    birthDate: {
      type: Date,
    },
    // card: [
    //   {
    //     name: { type: String, minlength: 1 },
    //     cardNumber: { type: String, minlength: 16, maxlength: 16 },
    //     expiryDate: { type: String },
    //     cvv: { type: String, minlength: 3, maxlength: 3 },
    //     cardType: { type: String, enum: Object.values(CONSTANTS.CARD_TYPE_OBJ) },
    //     pin: { type: String, minlength: 4, maxlength: 4 },
    //   }
    // ], 
    link: {
      type: String,
      required: [true, "Account link is required"],
      default: `${config.FRONTEND_ORIGIN_URL}-${shortIdGen(12)}`,
    },
    likers: [{
        type: Schema.Types.ObjectId,
        ref: "Like",
      }],
      raters: [{
        type: Schema.Types.ObjectId,
        ref: "Like",
      }],
      reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
      }],
      locationData: {
        lat: {
          type: Number,
          default: 0
        },
        lng: {
          type: Number,
          default: 0
        },
        others: {
          type: Object
        }
      },
      availability: {
        type: String,
        require: true,
        enum: Array.from(Object.values(CONSTANTS.RIDER.ACC_STATUS_OBJ)),
        default: CONSTANTS.RIDER.ACC_STATUS_OBJ.offline,
      }
},

{timestamps: true}
);

const AccountModel = model("Account", AccountSchema);

module.exports = AccountModel;