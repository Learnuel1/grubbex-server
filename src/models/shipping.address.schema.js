const {Schema, model} = require("mongoose");
const { CONSTANTS } = require("../config");
  
const ShippingAddressSchema = new  Schema({
  account: { 
    type: Schema.Types.ObjectId, 
    ref: "Account", 
    required: [true, "Account ID is required"], 
    indexed: true
},
  userId: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: 10, 
    maxlength: 10 ,
    indexed: true,
},
addressId : {
    type: String, 
    required: true, 
    trim: true, 
    minlength: 10, 
    maxlength: 10,
    indexed: true
},
  title: { 
    type: String, 
    // required: [true, "Title is required"],
    trim: true,
     minlength: 2 
    }, 
  street: { 
    type: String, 
    // required: true, 
    minlength: 2 

  },
  houseNumber: {
     type: String, 
    // required: true, 
    minlength: 1 

  },
  city: { 
    type: String, 
    // required: true, 
    minlength: 2 

  },
  state: { 
    type: String, 
    // required: true, 
    minlength: 2 

  },
  // status: { 
  //   type: String, 
  //   enum: Array.from(Object.values( CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ)), 
  //   default: CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ.other 
  // },
  countryCode: {
    type: String,
    maxlength: 4,
  },
  location: {
    latitude: { 
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    formattedAddress: { type: String }
  },
    
}, { timestamps: true });

const ShippingAddressModel =
model("ShippingAddress", ShippingAddressSchema);

module.exports = ShippingAddressModel;