const { model,Schema } = require('mongoose');
const { CONSTANTS } = require('../config');

const LikeSchema = new Schema({
    prodId: {
        type: String,
        trim: true,
        minlength: [20, "Product ID must be 20 characters"],
        maxlength: [20, "Product ID cannot exceed 20 characters"],
        description: "Product ID",
        index: true,
        sparse: true, 
    },
    storeId: {
        type: String,
        trim: true,
        length: [15, "Store ID must be 15 characters"],
        description: "Store ID",
        index: true,
        sparse: true, 
    },
    riderId: {
        type: String,
        trim: true,
        minlength: [10, "Rider ID must be 10 characters"],
        maxlength: [10, "Rider ID cannot exceed 10 characters"],
        description: "Rider ID",
        index: true,
        sparse: true, 
    },
    product: {
        type: Schema.Types.ObjectId, 
        ref:"Product",
        index: true,
        sparse: true,
    },
    store: {
        type: Schema.Types.ObjectId, 
        ref:"Store",
        index: true,
        sparse: true,
    },
    account: {
        type: Schema.Types.ObjectId,
        required: true,
        ref:"Account",
    },
    userId: {
        type: String,
        required: true,
        trim: true,
        minlength: [10, "User ID must be 10 characters"],
        maxlength: [10, "User ID cannot exceed 10 characters"],
        description: "User ID",
    },
    rating: {
        type: Number,
        default: 0,
        required: true,
        minlength: [1, "Rating must be between 1 and 5"],
        maxlength: [5, "Rating must be between 1 and 5"],
    },
    ratingWeight: {
        type: Number,
        default: 0.0,
        required: true,
    },
    type: {
        type: String,
        enum: CONSTANTS.ENDORSEMENT_TYPE,
        required: true,
    },
     
}, {timestamps: true});

const LikeModel = model('Like', LikeSchema);
module.exports= LikeModel;