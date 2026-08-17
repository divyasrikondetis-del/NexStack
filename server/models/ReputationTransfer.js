const mongoose = require("mongoose");

const reputationTransferSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    points: {
      type: Number,
      required: true,
      min: 1,
      max: 50, // Maximum 50 points per transaction
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    transferredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ReputationTransfer",
  reputationTransferSchema
);