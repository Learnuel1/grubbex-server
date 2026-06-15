const {z} = require("zod");
const { CONSTANTS } = require("../../config"); 
const { Types } = require("mongoose");
exports.ZChatSchema = z.object({ 
    id: z.string({
        description: "ID of the chat",
        required_error: "Chat ID is required",
        validation_error: "Chat ID is invalid",
    }).min(24).max(24).trim(),
    sender:  z.instanceof(Types.ObjectId),
    receiver: z.instanceof(Types.ObjectId),
    message: z.string({
         description: "The message sent by the sender",
         require_error: "Message is required",
    })
    .trim()
    .min(1)
    .max(500),
    userId: z.string({
        description: "User ID of the chat",
        required_error: "User ID is required",
        validation_error: "User ID is invalid",
    }),
    sendStatus: z.enum(CONSTANTS.CHAT_STATUS )
    .default(CONSTANTS.CHAT_STATUS_OBJ.sent),
    receiverStatus: z.enum(CONSTANTS.CHAT_STATUS )
    .default(CONSTANTS.CHAT_STATUS_OBJ.sent),
    status: z.enum(CONSTANTS.CHAT_STATUS )
    .default(CONSTANTS.CHAT_STATUS_OBJ.sent),
});