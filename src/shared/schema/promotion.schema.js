const { z } = require("zod"); 
const { CONSTANTS } = require("../../config");
const { Types } = require("mongoose");

exports.ZPromotionSchema = z.object({
    id: z.string({
        description: "Promotion ID",
        required_error: "Promotion ID is required",
        invalid_type_error: "Promotion ID must be a string",
    })
    .min(20, { message: "Promotion ID must be at least 20 characters" })
    .max(20, { message: "Promotion ID must be 20 characters" }),
    name: z.string({
        description: "Promotion name",
        required_error: "Promotion name is required",
        invalid_type_error: "Promotion name must be a string",
    }).min(3, { message: "Promotion name must be at least 3 characters" }).max(100, { message: "Promotion name must be at least 50 characters" }),
    status: z.enum(CONSTANTS.PROMOTION_STATUS, {
        description: "Promotion status",
        required_error: "Promotion status is required",
        invalid_type_error: "Promotion status must be a string",
    }).default(CONSTANTS.PROMOTION_STATUS_OBJ.inactive),
    startDate: z.date({
        description: "Start date of the promotion",
        required_error: "Start date is required",
        invalid_type_error: "Start date must be a date",
    }),
    link: z.string({
        description: "Promotion link",
        required_error: "Promotion link is required",
        invalid_type_error: "Promotion link must be a string",
    }).url("Promotion link must be a valid URL").optional(),
    account: z.instanceof(Object).refine((val) => val instanceof Types.ObjectId, {
        message: "Admin ID is required",
    }),
    duration: z.string({
        description: "Duration of the promotion",
        required_error: "Promotion duration is required",
        invalid_type_error: "Promotion duration must be a number",
    }).min(1, { message: "Promotion duration must be at least 1" }).max(30, { message: "Promotion duration must be at most 30" }),
});
