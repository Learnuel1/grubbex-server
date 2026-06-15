const { model } = require("mongoose");
const { Schema } = require("mongoose");

const TownSchema = new Schema({
  townId: {
    type: String,
    unique: true,
    required: true,
    indexed: true,
  },
  town: {
    type: String, 
    indexed: true,
    required: true,

  },
  cityId:{
    type: String,
    required: true,
    indexed: true,
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "Citie",
    required: true,
  }
 
}, {timestamps: true});

const TownModel = model("Town", TownSchema);
module.exports = TownModel;