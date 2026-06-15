const { z } = require('zod');
const { Types } = require('mongoose');
const { CONSTANTS } = require('../../config');
 
exports.ZTicketSchema = z.object({
    id: z.string({
        description: "Ticket ID",
        required_error: "Ticket ID is required",
    }).trim().nonempty({message: "Ticket ID cannot be empty"}).min(20, {message: "Ticket ID must be 20 characters"}).max(20, {message: "Ticket ID cannot exceed 20 characters"}),
    sender: z.instanceof(Types.ObjectId).refine(val => Types.ObjectId.isValid(val), {
        message: "Invalid Id for sender"
    }),
    title: z.string({
        description: "Ticket title",
        required_error:"Ticket Title is required",
    }).nonempty({ message: "Ticket Title cannot be empty" }).min(10, {message: "Title must be at least 10 characters"}).max(50, {message: "title should not exceed 50 characters"}),
    description: z.string().nonempty({ message: "Description cannot be empty" }),
    status: z.enum(CONSTANTS.TICKET_STATUS, { message: "status must be either 'open' or 'closed'" }).default(CONSTANTS.TICKET_STATUS_OBJ.open),
    priority: z.enum(CONSTANTS.TICKET_PRIORITY, { message: "priority must be either 'high' or 'low'" }).default(CONSTANTS.TICKET_PRIORITY_OBJ.high).optional(),
    closedBy: z.instanceof(Types.ObjectId).refine(val => val === undefined || Types.ObjectId.isValid(val), {
        message: "Invalid ID for closedBy"
    }).optional(),
     viewed: z.boolean().default(false),
     chat: z.array(z.object({
        
     })).max(100, {message: "Maximum chat per ticket reached, create a new Ticket"})
     .optional(),
});
 