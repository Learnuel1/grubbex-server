const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const SettingSchema = new Schema({
    notification : {
        type: [],
        default: [], 
 },
    general: {
        email: {
            type: String,
            // required: true,
        },
        phoneNumber: {
            type: String,
            // required: true,
        },
        legalAddress: {
            type: String,
            // required: true,
        },
    },
    userManagement: [
        {
        accountType: {
            type: String,
            enum: Array.from(Object.values(CONSTANTS.ADMIN.ACCOUNT_TYPE_OBJ)),
        },
        permission: {
            type: [String],
            enum: Array.from(Object.values(CONSTANTS.ADMIN.PERMISSION_OBJ)),
        },
        createdBy: Object,
    }
],
    emailTemplates: [
        {
        name: {
            type: String,
            enum: Array.from(Object.values(CONSTANTS.EMAIL_TEMPLATES_OBJ)),
        },
        template: {
            type: String, 
        },
        createdBy: Object,
    },
],
payoutDuration: [
    {
    name: {
        type: String,
        enum: Array.from(Object.values(CONSTANTS.SETTING_FIELDS_OBJ.payoutDuration)),
    },
    numberOfDays: {
        type: Number,
    },
     createdBy: Object,
}
]
}, { timestamps: true });

const SettingModel = model("Setting", SettingSchema);
module.exports = SettingModel;