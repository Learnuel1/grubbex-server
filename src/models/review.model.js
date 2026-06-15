const {Schema, model} = require("mongoose");
const ReviewSchema = new Schema ({
    id: {
        type: String,
        required: [true, "Review ID is required"],
        indexed: true,
        unique: true,
        minlength: [20, "Review ID must be 20 characters"],
        maxlength: [20, "Review ID cannot exceed 20 characters"],
    },
    storeId: {
        type: String, 
        indexed: true,
        minlength: [15, "Store ID must be 20 characters"],
        maxlength: [20, "Store ID cannot exceed 20 characters"],
    },
    prodId: {
        type: String,
        indexed: true,
        minlength: [20, "Product ID must be 20 characters"],
        maxlength: [20, "Product ID cannot exceed 20 characters"],
    },
    riderId: {
        type: String,
        indexed: true,
        minlength: [20, "Product ID must be 20 characters"],
        maxlength: [20, "Product ID cannot exceed 20 characters"],
    },
    rider: {
        type: Schema.Types.ObjectId,
        ref: "Account", 
    },
    shopper: {
        type: Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Shopper ID is required"],
    },
    review: {
        type: String,
        required: [true, "Review is required"],
        minlength: [2, "Review must be at least 2 characters"],
        maxlength: [200, "Review cannot exceed 200 characters"],
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: "Store", 
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product", 
    } 
}, 
{timestamp: true}
);
const ReviewModel = model("Review", ReviewSchema);
module.exports = ReviewModel;