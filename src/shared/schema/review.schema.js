const { z } = require("zod");
const {Types} = require("mongoose")
exports.ZReviewSchema = z.object({
    id: z.string({
        description: "Review ID",
        required_error: "Review ID is required",
        invalid_type_error: "Review ID is invalid",
    })
    .min(20, "Review ID must be 20 characters")
    .max(20, "Review ID cannot exceed 20 characters")
    .trim(),
    storeId: z.string({
        description: "Store ID",
        required_error: "Store ID is required",
        invalid_type_error: "Store ID is invalid",
    })
    .min(15, {message: "Store ID must be 15 characters"})
    .max(20, {message: "Store ID cannot exceed 20 characters"})
    .trim()
    .optional(),
    riderId: z.string({
        description: "Store ID",
        required_error: "Store ID is required",
        invalid_type_error: "Store ID is invalid",
    })
    .min(10, {message: "Store ID must be 10 characters"})
    .max(10, {message: "Store ID cannot exceed 10 characters"})
    .trim()
    .optional(),
    prodId: z.string({
        description: "Product ID",
        required_error: "Product ID is required",
        invalid_type_error: "Product ID is invalid",
    })
    .min(20, {message: "Product ID must be 20 characters"})
    .max(20, {message: "Product ID cannot exceed 20 characters"})
    .trim()
    .optional(),
    shopper: z.instanceof(Types.ObjectId), 
    review: z.string({
        description: "Review",
        required_error: "Review is required", 
    })
    .min(2, {message: "Review must be at least 2 characters"})
    .max(200, {message: "Review cannot exceed 200 characters"})
    .trim(),
    store: z.instanceof(Types.ObjectId).optional(),
    product: z.instanceof(Types.ObjectId).optional(),
    rider: z.instanceof(Types.ObjectId).optional(),
})