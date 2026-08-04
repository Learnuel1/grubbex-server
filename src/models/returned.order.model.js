const  { Schema, Types, model } = require('mongoose');
const { CONSTANTS } = require('../config');
 
const ReturnedOrderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        minlength: 20,
        maxlength: 20,
        trim: true,
        description: "Order ID"
    },
    order: {
        type: Types.ObjectId,
        required: true,
        ref: "Order",
    },
    storeId: {
        type: String,
        required: true,
        minlength: 15,
        maxlength: 15,
        trim: true,
        description: "Store ID"
    },
    rider: {
        type: Types.ObjectId,
        ref: 'Account',
        required: false
    },
    riderId: {
        type: String,
        minlength: 10,
        maxlength: 10,
        required: false,
        description: "Rider ID"
    },
    isAvailable: {
        type: Boolean,
        default: true
    }, 
    phoneNumber: {
            type: String,
            required: [true, "Order Phone number is required"],
            minlength: 11,
            maxlength: 15,
            trim: true
        },
    destinationAddress: {
        account: {
            type: Types.ObjectId,
            ref: 'Account',
            required: false
        },
        userId: {
            type: String,
            minlength: 10,
            maxlength: 10,
            trim: true
        },
        addressId: {
            type: String,
            minlength: 10,
            maxlength: 10,
            trim: true
        },
        title: {
            type: String,
            minlength: 2
        }, 
        street: {
            type: String,
            minlength: 2
        },
        houseNumber: {
            type: String,
            minlength: 1
        },
        city: {
            type: String,
            minlength: 2
        },
        state: {
            type: String,
            minlength: 2
        },
        status: {
            type: String,
            enum: Object.values(CONSTANTS.SHIPPING_ADDRESS_STATUS_OBJ),
            required: false
        },
        location: {   
            type: { type: String, enum: ['Point'], default: "Point" },
            coordinates: { type: [Number] },
         formattedAddress: { type: String },
         latitude: { type: Number },
         longitude: { type: Number },
        },
        
        distanceValue: {
            type: Number
        },
        distance: {
            type: String
        },
        duration: {
            type: String
        },
        deliveryPrice: {
            type: Number
        }
    },
    store: {
        type: Types.ObjectId,
        ref:"Store",
        required: true,
        index: true
    },
    shopperId: {
        type: String,
        minlength: 10,
        maxlength: 10,
        trim: true,
        required: true
    },
     
    shopper: {
        type: Types.ObjectId,
        ref: 'Account',
        required: true
    },
    paymentType: {
        type: String,
        enum: Object.values(CONSTANTS.PAYMENT_TYPE_OBJ),
        required: true
    }, 
     
    storeStatus: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending
    },
    returnStatus: {
         type: String,
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending
    },
    adminStatus: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending
    },
    type: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_TYPE_OBJ),
        required: true
    },
     
    qrText: {
        type: String,
        required: [true, "Order QR text is required"],
    },
    qrCode: {
        id: {
            type: String,
            required: true,
            default: "qr-code-placeholder",
        },
        url: {
            type: String,
            required: true,
            default: "https://res.cloudinary.com/dzqj1x3qk/image/upload/v1735681234/qr-code-placeholder.png",
        },
        token: {
            type: String,
            required: false
        }
    },
    pickupType: {
        type: String,
        require: true,
        enum: ["rider", "dropOff"],
    },
    reason: {
        type: String,
        maxlength: 500,
        required: true, 
    },
    images: [{
            id:String,
            url: String
    }],
    video: {
        id: String,
        url: String,
    },
    auth: {
    pickedUpAt: {
        type: Date,
        required: false
    },
    deliveredAt: {
        type: Date,
        required: false
    },
    token: {
        type: String,
        required: false
    },
    code: {
        type: String,
        required: false
    },
},
riderCurrentLocation: { 
    formattedAddress: { type: String },
    latitude: { type: Number, default:0 },
    longitude: { type: Number,default:0 }
}, 

returnedOrderStates: [{
    status:{
        type: String, 
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending 
       },
    date: {
       type: Date, 
        default: new Date,
    },
    by: { 
        type: Schema.Types.ObjectId,
        ref: "Account",
    },
    type:{
        type: String,
    },
    currentState: {type: String, 
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ)}
}],

returnedPayment: [ {
        amount: {
            type: Number,
            default: 0,
            
        },
        status: {
            type: String,
            enum: Array.from(Object.values(CONSTANTS.ORDER_PAYMENT_STATUS)),
            default: CONSTANTS.ORDER_PAYMENT_STATUS.pending
        },
        date: {
            type: Date,
            required: true,
            default: new Date(),
        }
    }
    ]
}, { timestamps: true });

ReturnedOrderSchema.index({createdAt: 1, "destinationAddress.location":"2dsphere" })
 const ReturnedOrderModel = model('ReturnedOrder', ReturnedOrderSchema);
module.exports = ReturnedOrderModel;
