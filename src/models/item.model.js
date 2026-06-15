const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const ItemSchema = new Schema({
  name: {
    type: String,
    unique: [true, "Item already exist"],
    required: [true, "item name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Item category is required"],
    enum: CONSTANTS.ITEM_CATEGORY,
    trim: true,
  },
  admin: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: [true, "Admin privilege is required"],
  },
},
{timestamps: true}
);

const ItemModel = model("Item", ItemSchema);
module.exports = ItemModel;