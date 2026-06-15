const { Schema, model} = require('mongoose');
const { CONSTANTS } = require('../config');
 
const TicketSchema = new Schema({
    id: {
        type: String,
        required: [true, "Ticket ID is required"],
        unique: true,
        trim: true,
        index: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Account',
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 50
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 250
    },
    status: {
        type: String,
        enum: CONSTANTS.TICKET_STATUS,
        default: CONSTANTS.TICKET_STATUS_OBJ.open,
    },
    priority: {
        type: String,
        enum: CONSTANTS.TICKET_PRIORITY,
        default: CONSTANTS.TICKET_PRIORITY_OBJ.high
    },
    viewed: {
        type: Boolean,
        default: false,
        index: true,
    },
    closedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Account', 
    },
    chat: {
        type: [{
            id: String,
            sender: {
                type: Object,
                required: [true, "Sender ID is required"],
                index: true
            },
            receiver: Object,
            message:{
                type: String, 
                required: true, 
                minlength:1,
                maxlength:250,
            },
            viewed: {
                type: Boolean,
                default: false,
            },
            createdAt: {
                type: Date,
                required: true,
                default: Date.now(),
            }
        }],
        maxlength: [100, "Chat limit reached per Ticket"],
    }
    
}, 
{timestamps:true}
);

const TicketModel = model('Ticket', TicketSchema);

module.exports = TicketModel;