const {Schema, model} = require('mongoose'); 
const { CONSTANTS } = require('../config');

const faqSchema = new Schema({
    id: {
        type: String,
        required: [true, "FAQ ID is required"],
        length: [20, "FAQ ID must be 20 characters"],
        trim: true
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        minlength: [10, "FAQ Title should be at least 10 characters"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        minlength: [10, "FAQ description must be at least 10 characters"],
        trim: true
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        minlength: [3, "FAQ category should be at least 5 characters"],
        trim: true,
        // unique: [true, `Category already exist`]
    },
    target: {
        type: String,
        required: [true, "Target is required"],
        enum: Array.from(Object.values(CONSTANTS.FAQ_TARGET_OBJ)),
        lowercase: true,
        trim: true
    },
    account: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    }
},
{timestamps: true},
  );

const FaqModel = model('Faq', faqSchema);

module.exports = FaqModel;