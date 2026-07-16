const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // NEW: Image support
    image: {
      type: String,
      default: null,
    },
    // NEW: Code snippet support
    codeSnippet: {
      language: String,
      code: String,
    },
    // NEW: Hashtags
    hashtags: [String],
    likes: {
      type: Number,
      default: 0,
    },
    // NEW: Track who liked
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // NEW: Bookmarks
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    comments: [
      {
        user: String,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        // NEW: Replies to comments
        replies: [
          {
            user: String,
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            text: String,
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // NEW: Share count
    shares: {
      type: Number,
      default: 0,
    },
    // NEW: Report system
    isReported: {
      type: Boolean,
      default: false,
    },
    reports: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        status: {
          type: String,
          enum: ["pending", "approved", "dismissed"],
          default: "pending",
        },
        reviewedAt: Date,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // NEW: Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// NEW: Indexes for faster queries
postSchema.index({ likes: -1, comments: -1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ authorId: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
