const { z } = require('zod');
const { ObjectId } = require('mongodb');
const { Types } = require('mongoose');
const { CONSTANTS } = require('../../config');

 
exports.ZFaqSchema = z.object({ 
    id: z.string({
        description: "FAQ ID",
        required_error: "FAQ ID is required",
    }).trim().length(20, { message: "FAQ ID must be 20 characters" }), 
    title: z.string({
        required_error: "FAQ Title is required",
    }).trim().min(10, {message: "FAQ Title should be at least 10 character"}),
    description: z.string({
        required_error: "FAQ Description is required",
    }).trim().min(10, {message: "FAQ description must be at least 10 characters"}),
    category: z.string({
        required_error: "FAQ Category is required",
    }).trim().min(3, {message: "FAQ category should be at least 5 characters"}),
    account: z.instanceof(Types.ObjectId).refine((val) => Types.ObjectId.isValid(val), {
        message: "User ID is required",
    }), 
    target: z.enum(Array.from(Object.values(CONSTANTS.FAQ_TARGET_OBJ)), {
        required_error: "FAQ Target is required",
    })
});