const mongoose = require("mongoose");

const reputationTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "answer",
        "accepted_answer",
        "answer_upvotes",
        "question_upvotes",
        "profile_completed",
        "downvote",
        "answer_deleted",
        "admin_removed",
        "transfer_sent",
        "transfer_received",
      ],
      required: true,
    },

    points: {
      type: Number,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ReputationTransaction",
  reputationTransactionSchema
);