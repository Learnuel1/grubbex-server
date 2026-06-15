const { Schema, model } = require("mongoose");
const { CONSTANTS } = require("../config");

const StoreCategorySchema = new Schema({
  id : {
    type: String,
    unique: true,
    indexed: true,
    required: [true, "Store category ID is required"]
  },
  name: {
    type: String,
    required: [true, "Store category name is required"],
    indexed: true
  },
  description :{
    type: String,
  },
  subCategory: [],
  image: {
    type: Array,
    maxLength: 1,
  },
  status: {
    type: String,
    required: [true, "Store category status is required"],
    enum: CONSTANTS.CATEGORY_STATUS,
    default: CONSTANTS.CATEGORY_STATUS_OBJ.published,
  },
  createdBy: {
    type: {
      name: String,
      role: String,
      id: String
    },
     
  }
},
{timestamps: true}
);
const StoreCategoryModel = model("StoreCategorie", StoreCategorySchema);
module.exports = StoreCategoryModel;
