const { Schema, model } = require('mongoose');

const mutedOrderSchema = new Schema({
    orderId: {
        type: String,
        required: [true, 'Order ID is required'],
        minlength: [20, 'Order ID must be 20 characters'],
        maxlength: [20, 'Order ID cannot exceed 20 characters'],
        trim: true,
        validate: {
            validator: function(v) {
                return typeof v === 'string' && v.length === 20;
            },
            message: 'Order ID is invalid'
        },
        description: 'Order ID'
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order reference is required'],
        description: 'Reference to the original Order'
    },
    riderId: {
        type: String,
        minlength: [10, 'Rider ID must be 10 characters'],
        maxlength: [10, 'Rider ID cannot exceed 10 characters'],
        trim: true,
        description: 'Rider ID'
    },
    rider: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: false,
        description: 'Reference to the Rider Account'
    },
    duration: {
        type: Date,
        required: [true, 'Duration is required'],
        description: 'Duration until which the order is muted'
    },
}, { timestamps: true });
const MutedOrderModel =  model('MutedOrder', mutedOrderSchema);
module.exports =  MutedOrderModel;