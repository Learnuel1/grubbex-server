const { model } = require("mongoose");
const { Schema } = require("mongoose");

const PreferenceSchema = new Schema({
  id: {
    type: String,
    required: [true, "Preference ID is required"],
    trim: true,
    unique: true,
    index: true,
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Account ID is required"],
    index: true,
  },
  category: {
    type: [],
    index: true,
  },
  createdForYou: {
    type: [],
    index: true
  },
  searched:{
    type: [],
    index: true
  }
}, {timestamps: true});
const PreferenceModel = new model("Preference", PreferenceSchema);
module.exports = PreferenceModel;
