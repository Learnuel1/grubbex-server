const  { Schema, Types, model } = require('mongoose');
const { CONSTANTS } = require('../config');
 
const OrderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        minlength: 20,
        maxlength: 20,
        trim: true,
        description: "Order ID"
    },
    storeId: {
        type: String,
        required: true,
        minlength: 15,
        maxlength: 15,
        trim: true,
        description: "Store ID"
    },
    items: [{
        type: Schema.Types.Mixed, // Replace with your Product schema reference if available
        required: true
    }],
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
            latitude: { type: Number },
            longitude: { type: Number },
            formattedAddress: { type: String }
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
    store: [{
        type: Schema.Types.Mixed // Define structure if needed
    }],
    shopperId: {
        type: String,
        minlength: 10,
        maxlength: 10,
        trim: true,
        required: true
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    vat: {
        type: Number,
        min: 0,
        default: 0
    },
    promoCode: [{
        type: String
    }],
    discount: {
        type: Number,
        min: 0,
        default: 0
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
    status: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending
    },
    storeStatus: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_STATUS_OBJ),
        default: CONSTANTS.ORDER_STATUS_OBJ.pending
    },
    type: {
        type: String,
        enum: Object.values(CONSTANTS.ORDER_TYPE_OBJ),
        required: true
    },
    reference: {
        type: String,
        required: true,
        unique: true
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
    note: {
        type: String,
        maxlength: 500,
        required: false, 
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
    riderCurrentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    }
}
}, { timestamps: true });

 const OrderModel = model('Order', OrderSchema);
module.exports = OrderModel;
