const { Schema, model, Types } = require('mongoose');const { CONSTANTS } = require('../config');
;

const promotionSchema = new Schema({
    id: {
        type: String,
        required: [true, "Promotion ID is required"],
        minlength: [20, "Promotion ID must be at least 20 characters"],
        maxlength: [20, "Promotion ID must be 20 characters"],
        index: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, "Promotion name is required"],
        minlength: [3, "Promotion name must be at least 3 characters"],
        maxlength: [100, "Promotion name must be at most 100 characters"]
    },
    status: {
        type: String,
        enum: CONSTANTS.PROMOTION_STATUS,
        default: CONSTANTS.PROMOTION_STATUS_OBJ.inactive, 
        index: true,
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"],
        index: true,
    },
    image: {
        id: {
            type: String,
            required: [true, "Promotion image ID is required"], 
        },
        url: {
            type: String,
            required: [true, "Promotion image ID is required"],
            validate: {
                validator: function (v) {
                    return /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(v);
                },
                message: "Promotion image url must be a valid URL"
            }, 
        },
    },
    endDate: {
        type: Date,
        required: [true, "Start date is required"],
        index: true,
    },
    link: {
        type: String,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/[^\s$.?#].[^\s]*)$/i.test(v);
            },
            message: "Promotion link must be a valid URL"
        }, 
    },
    account: {
        type: Types.ObjectId,
        required: [true, "Admin ID is required"],
        ref: "Account",
    },
    duration: {
        type: Number,
        required: [true, "Promotion duration is required"],
        min: [1, "Promotion duration must be at least 1"],
        max: [30, "Promotion duration must be at most 30"]
    }
});

const PromotionModel = model('Promotion', promotionSchema);

module.exports = PromotionModel;