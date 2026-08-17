const mongoose = require("mongoose");

const planLimits = {
  free: 1,
  bronze: 5,
  silver: 15,
  gold: -1,
};

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
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
    provider: {
      type: String,
      enum: ["manual", "razorpay"],
      default: "manual",
    },
    providerSubscriptionId: {
      type: String,
      default: "",
    },
    questionLimitPerDay: {
      type: Number,
      default: planLimits.free,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    renewalDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    billingDetails: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "India" },
      postalCode: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
