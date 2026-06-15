const { model, Schema } = require("mongoose");
const { CONSTANTS } = require("../config");

const ChatSchema = new Schema({
id: {
    type: String,
    required: [true, "Chat ID is required"],
    index: true,
    unique: true,   
    trim: true,
},
userId : {
    type: String,
    required: [true, "User ID is required"],
    trim: true,
},
sender: {
    type: Schema.Types.ObjectId,
    required: [true, "Sender ID is required"],
    index: true,
    trim: true,
    ref: "Account",
},
receiver: {
    type: Schema.Types.ObjectId,
    required: [true, "Receiver ID is required"],
    index: true,
    trim: true,
    ref: "Account",
},
message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    minlength: [1, "Message is too short"],
    maxlength: [500, "Message is too long"],
},
status: {
    type: String,
    enum: CONSTANTS.CHAT_STATUS,
    default: CONSTANTS.CHAT_STATUS_OBJ.sent,
    trim: true,
},
senderStatus: {
    type: String,
    enum: CONSTANTS.CHAT_STATUS,
    default: CONSTANTS.CHAT_STATUS_OBJ.sent,
    trim: true,
},
receiverStatus: {
    type: String,
    enum: CONSTANTS.CHAT_STATUS,
    default: CONSTANTS.CHAT_STATUS_OBJ.sent,
    trim: true,
},
},
{timestamps: true}
);
const ChatModel = model("Chat", ChatSchema);
module.exports = ChatModel;