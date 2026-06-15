const { model } = require("mongoose");
const { Schema } = require("mongoose");

const CitySchema = new Schema({
  cityId: {
    type: String,
    unique: true,
    required: true,
    indexed: true,
  },
  city: {
    type: String,
    unique: true,
    indexed: true,
    required: true,

  },
 
}, {timestamps: true});

const CityModel = model("Citie", CitySchema);
module.exports = CityModel;