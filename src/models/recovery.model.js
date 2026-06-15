const { Schema, model } = require("mongoose");

const RecoveryLinkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      require: true,
    },
    uniqueString: {
      type: String,
      required: [true, "ID is required"],
      trim: true
    },
    token: {
      type: String,  
      index: true,
      required:true,
    },
  },
  {timestamps: true},
);
const RecoveryLinkModel = model("RecoveryLink", RecoveryLinkSchema);
module.exports = RecoveryLinkModel;