const { Schema, model } = require("mongoose");

const InvitationSchema = new Schema({
   id: {
    type: String,
    required: true,
    unique: true,
   },
  email: {
    type: String, 
    trim: true,
    index: true, 
    required: true,
  }, 
  token: {
    type: String,  
    index: true,
    required:true,
  },
  
  role: {
    type: String,
    index: true,
    trim: true,
    required: true,
  },
},
{timestamps: true}
);

const InvitationModel = model("Invitation", InvitationSchema);

module.exports = InvitationModel;