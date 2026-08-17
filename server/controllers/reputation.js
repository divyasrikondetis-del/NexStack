const User = require("../models/User");

const transferReputation = async (req, res) => {
  try {
    const { senderId, receiverId, points, reason } = req.body;

    console.log("Transfer request:", { senderId, receiverId, points, reason });

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "You cannot transfer reputation to yourself.",
      });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if ((sender.reputation || 0) < points) {
      return res.status(400).json({
        message: `You don't have enough reputation. You have ${sender.reputation || 0}, need ${points}.`,
      });
    }

    if (points < 1 || points > 50) {
      return res.status(400).json({
        message: "Points must be between 1 and 50.",
      });
    }

    sender.reputation = (sender.reputation || 0) - points;
    receiver.reputation = (receiver.reputation || 0) + points;

    if (!sender.reputationHistory) sender.reputationHistory = [];
    if (!receiver.reputationHistory) receiver.reputationHistory = [];

    sender.reputationHistory.push({
      action: "Transfer Sent",
      points: -points,
      reason: reason || "Reputation transfer",
    });

    receiver.reputationHistory.push({
      action: "Transfer Received",
      points: points,
      reason: reason || "Reputation transfer",
    });

    await sender.save();
    await receiver.save();

    console.log("Updated reputations:", {
      sender: sender.reputation,
      receiver: receiver.reputation,
    });

    res.status(200).json({
      message: "Reputation transferred successfully!",
      senderReputation: sender.reputation,
      receiverReputation: receiver.reputation,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    res.status(500).json({
      message: error.message || "Server error during transfer",
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("reputationHistory");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user.reputationHistory || []);
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  transferReputation,
  getHistory,
};