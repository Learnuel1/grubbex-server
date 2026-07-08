const { Schema } = require("mongoose");
const { CONSTANTS } = require("../config");
const { model } = require("mongoose");

const TemporalTransactionSchema = new Schema({
    reference: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    }, 
    event: {
        type: String,
        enum: Array.from(Object.values(CONSTANTS.TRANSACTION_TYPE)),
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: Array.from(Object.values(CONSTANTS.TRANSACTION_TYPE)),
    },
    id: {
        type: String,
        trim: true,
    }
    
},{timestamps: true});
const TemporalTransactionModel = model("TemporalTransaction", TemporalTransactionSchema);
module.exports = TemporalTransactionModel;