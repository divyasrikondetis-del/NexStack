const mongoose = require("mongoose");

const forgotPasswordRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastRequestDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ForgotPasswordRequest",
  forgotPasswordRequestSchema
);