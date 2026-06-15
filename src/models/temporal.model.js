import {Schema, model } from "mongoose";
const TemporalAccountSchema = new Schema({
  email: {
    type: String,
    require: true,
    index: true,
  },
  refreshToken:{
    type: Array,
    require: true,
  },
  otp: {
    type: string,
    require: true
  },

},{
  timestamps:true
});

const TemporalAccountModel = model("temporalAccount", TemporalAccountSchema);
export default TemporalAccountModel;