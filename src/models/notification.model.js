const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const NotificationSchema = new  Schema({
  id : {
    type: String,
    required: [true, "ID is required"],
    index: true,
    unique: true,
    trim: true,
  },
  userId:{
    type: String,
    index: true, 
    required: true
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
    index: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
    collation: { locale: 'en', strength: 2 }, // ignore case for index 
  },
  category : {
    type: String,
    required: [true, "category is required"],
    enum: Array.from(Object.values(CONSTANTS.NOTIFICATION_TYPE_OBJ)),
    collation: { locale: 'en', strength: 2 }  
  },
  info: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
  },
  viewed: {
    type: Boolean,
    required: true,
    index: true,
    default: false,
  },
  viewedAt: {
    type: Date,
    index: true,
    sparse: true
  }
}, {timestamps: true});
const NotificationModel = model("Notification", NotificationSchema);
module.exports = NotificationModel;
