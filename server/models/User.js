const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "comment", "reply", "follow", "mention", "system", "answer"],
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

// Reputation Activity History
const reputationHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Reputation Transfer History
const reputationTransferSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    points: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Payment Schema (for Subscriptions)
const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    invoice: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Subscription Schema
const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "past_due", "cancelled"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
  },
  { timestamps: true }
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

    phoneNumber: {
      type: String,
      default: undefined,
      sparse: true,
      unique: true,
      trim: true,
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

    // ========================
    // Follow System
    // ========================

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

    // ========================
    // Notifications
    // ========================

    notifications: {
      type: [notificationSchema],
      default: [],
    },

    // ========================
    // Admin
    // ========================

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
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    reportCount: {
      type: Number,
      default: 0,
    },

    // ========================
    // Reputation System
    // ========================

    reputation: {
      type: Number,
      default: 0,
    },

    // ========================
    // Profile Completion
    // ========================

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    profileBonusClaimed: {
      type: Boolean,
      default: false,
    },

    language: {
      type: String,
      default: "en",
      enum: ["en", "es", "hi", "pt", "zh", "fr"],
    },

    // ========================
    // Reputation History
    // ========================

    reputationHistory: {
      type: [reputationHistorySchema],
      default: [],
    },

    reputationTransfers: {
      type: [reputationTransferSchema],
      default: [],
    },

    lastTransferDate: {
      type: Date,
      default: null,
    },

    transferredToday: {
      type: Number,
      default: 0,
    },

    // ========================
    // Community Privileges
    // ========================

    canComment: {
      type: Boolean,
      default: false,
    },

    canEditPosts: {
      type: Boolean,
      default: false,
    },

    canCloseQuestions: {
      type: Boolean,
      default: false,
    },

    canReportPosts: {
      type: Boolean,
      default: false,
    },

    // ========================
    // Subscription & Premium Membership
    // ========================

    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },

    premiumBadge: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", null],
      default: null,
    },

    // ========================
    // ✅ LOGIN OTP - ADD THESE FIELDS
    // ========================
    
    loginOtp: {
      type: String,
      default: null,
    },
    
    loginOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function normalizePhoneNumber(next) {
  if (typeof this.phoneNumber === "string") {
    const trimmed = this.phoneNumber.trim();
    this.phoneNumber = trimmed || undefined;
  }
  next();
});

// Method to update privileges based on reputation
userSchema.methods.updatePrivileges = function() {
  const rep = this.reputation || 0;
  
  this.canComment = rep >= 50;
  this.canEditPosts = rep >= 100;
  this.canCloseQuestions = rep >= 250;
  this.canReportPosts = rep >= 500;
  
  return this;
};

// Method to update premium badge based on subscription
userSchema.methods.updatePremiumBadge = function() {
  if (!this.subscription) return this;
  
  const planMap = {
    free: null,
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
  };
  
  this.premiumBadge = planMap[this.subscription.plan] || null;
  return this;
};

// Method to check if subscription is active
userSchema.methods.isSubscriptionActive = function() {
  if (!this.subscription) return false;
  return this.subscription.status === "active";
};

module.exports = mongoose.model("User", userSchema);