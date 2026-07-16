const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "comment", "reply", "follow", "mention"],
    },
    message: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    about: {
      type: String,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    joinedOn: {
      type: Date,
      default: Date.now,
    },

    // ⭐ Follow System
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ⭐ Notifications
    notifications: {
      type: [notificationSchema],
      default: [],
    },

    // ⭐ Admin Features
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedUntil: {
      type: Date,
      default: null,
    },

    suspensionReason: {
      type: String,
      default: "",
      trim: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    reportCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
