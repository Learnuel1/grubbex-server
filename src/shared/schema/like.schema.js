const { Types } = require('mongoose');
const { z } = require('zod');

exports.ZLikeRatingSchema = z.object({
    prodId: z.string({
        description: "Product ID",
        required_error: "Product ID is required",
        invalid_type_error: "Product ID must be a string",
    }).trim()
    .min(20, { message: "Product ID must be 20 characters" })
    .max(20, { message: "Product ID cannot exceed 20 characters" })
    .optional(),
    storeId: z.string({
        description: "Store ID",
        required_error: "Store ID is required",
        invalid_type_error: "Store ID must be a string",
    }).trim()
    .length(15, {message: "Store ID must be 15 characters"})
    .optional(),  
    riderId: z.string({
        description: "Rider ID",
        required_error: "Rider ID is required",
        invalid_type_error: "Rider ID must be a string",
    }).trim()
    .min(10)
    .max(10)
    .optional(),
    rating: z.number({
        description: "Rating",
        required_error: "Rating is required",
        invalid_type_error: "Rating must be a number",
    }).min(1, {message: "Rating must be between 1 and 5"})
    .max(5, {message: "Rating must be between 1 and 5"})
    .optional(),
    account: z.instanceof(Types.ObjectId)
}); 

exports.ZSearchLikeRatingSchema = z.object({
    prodId: z.string({
        description: "Product ID",
        required_error: "Product ID is required",
        invalid_type_error: "Product ID must be a string",
    }).trim()
    .min(20, { message: "Product ID must be 20 characters" })
    .max(20, { message: "Product ID cannot exceed 20 characters" })
    .optional(),
    storeId: z.string({
        description: "Store ID",
        required_error: "Store ID is required",
        invalid_type_error: "Store ID must be a string",
    }).trim()
    .length(15, {message: "Store ID must be 15 characters"})
    .optional(),  
    riderId: z.string({
        description: "Rider ID",
        required_error: "Rider ID is required",
        invalid_type_error: "Rider ID must be a string",
    }).trim()
    .min(10)
    .max(10)
    .optional(),
    rating: z.number({
        description: "Rating",
        required_error: "Rating is required",
        invalid_type_error: "Rating must be a number",
    }).min(1, {message: "Rating must be between 1 and 5"})
    .max(5, {message: "Rating must be between 1 and 5"})
    .optional(), 
    like: z.number({
        description: "Like",
        required_error: "Like is required",
        invalid_type_error: "Like must be a number",
    }).min(1, {message: "Like cannot be zero or negative"})
    .optional(), 
    followers: z.number({
        description: "followers",
        required_error: "followers is required",
        invalid_type_error: "followers must be a number",
    }).min(1, {message: "followers cannot be zero or negative"})
    .optional(), 
    search: z.string({
        description: "Search",
        required_error: "Search is required",
        invalid_type_error: "Search is invalid",
    }).min(1, {message: "Search must be at least one character"})
    .max(50, {message: "Search cannot exist 50 characters"})
    .optional(), 
}); 