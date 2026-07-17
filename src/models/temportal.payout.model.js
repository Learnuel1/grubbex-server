const { Schema, Types, model } = require("mongoose");

const TemporalPayoutSchema = new Schema({
    user: {
        type: Types.ObjectId,
        required: true,
        ref: "Account",
        index: true
    },
    recipientCode: {
        type: String,
        required: true,
        index: true
    },
    source: {
        type: String,
        require: true,
        enum: ["balance"],
    },
    reason: {
        type: String,
        required: true,
        minlength: [5, "Reason must be at least 5 characters"],
        maxlength: [200, "Reason cannot exceed 200 characters"]
    },
    amount: {
        type: Number,
        min: 0,
        required: [true, "Transfer amount is required"],
    },
    transferCode: {
        type: String,
        required: true,
        index: true
    },
    otpRequired: {
        type: String,
    }
}, {timestamps:true}
);

const TemporalTransferModel = model("TemporalTransfer", TemporalPayoutSchema);

module.exports = TemporalTransferModel;