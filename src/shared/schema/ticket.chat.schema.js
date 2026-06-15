const { Types } = require("mongoose");
const { z } = require("zod");

exports.ZTicketChatSchema = z.object({
    ticketId: z.string({
        description: "Ticket ID",
        required_error: "Ticket ID is required",
        required_type_error: "Ticket ID is invalid",
    }).length(20, {message: "Ticket ID must be 20 characters"}),
    id: z.string({
        description: "Chat ID",
        required_error: "Chat ID is required",
    }).trim()
    .min(20, { message: "Chat ID must be 20 characters" })
    .max(20, { message: "Chat ID cannot exceed 20 characters" }),
    sender: z.instanceof(Types.ObjectId).refine((val) => Types.ObjectId.isValid(val), {
        message: "Invalid sender ID",
    }), 
    message: z.string({
        description: "Chat message",
        required_error: "Chat message is required",
    }).trim()
    .min(1, {message: "Chat must be at least 1 character"})
    .max(250, {message: "Chat must not exceed 250 characters"}),
    viewed: z.boolean().default(false),
    createdAt: z.date({
        description: "Chat time",
        required_error: "Chat time is required",
    })
    .default( new Date()),
});