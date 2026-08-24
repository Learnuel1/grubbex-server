const {Schema, model} = require("mongoose");

const likeRateFollowReviewSchema = new Schema(
  {
    id: {
        type: String,
        required: [true, "Review ID is required"],
        indexed: true,
        unique: true,
        minlength: [20, "Review ID must be 20 characters"],
        maxlength: [20, "Review ID cannot exceed 20 characters"],
    },
    like: {
      type: Number,
      min: [0, "Like count cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Like count must be an integer",
      },
    },
    rating: {
      type: Number,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    follow: {
      type: Number,
      min: [0, "Follow count cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Follow count must be an integer",
      },
    },
    review: {
      type: String,
       minlength: [2, "Review must be at least 2 characters"],
        maxlength: [200, "Review cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,  
  }
);

const LikeRateFollowReview = model(
  "LikeRateFollowReview",
  likeRateFollowReviewSchema
);

module.exports = LikeRateFollowReview;