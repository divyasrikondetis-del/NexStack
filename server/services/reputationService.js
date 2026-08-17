const User = require("../models/User");

class ReputationService {
  // ========================
  // Add Reputation Points
  // ========================
  static async addReputation(userId, points, action, reason, relatedId = null, relatedModel = null) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (points < 0) throw new Error("Use removeReputation for negative points");

      user.reputation = (user.reputation || 0) + points;
      
      user.reputationHistory.push({
        action,
        points,
        reason,
        createdAt: new Date(),
      });

      // Update privileges
      user.updatePrivileges();

      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  // ========================
  // Remove Reputation Points
  // ========================
  static async removeReputation(userId, points, action, reason, relatedId = null, relatedModel = null) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (points < 0) throw new Error("Points must be positive");

      user.reputation = Math.max(0, (user.reputation || 0) - points);
      
      user.reputationHistory.push({
        action,
        points: -points,
        reason,
        createdAt: new Date(),
      });

      // Update privileges
      user.updatePrivileges();

      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  // ========================
  // Complete Profile - +10 Reputation (One-time)
  // ========================
  static async completeProfile(userId, about, tags) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      if (!about || !about.trim() || !tags || tags.length === 0) {
        throw new Error("Please provide about section and at least one skill tag");
      }

      user.about = about;
      user.tags = tags;
      user.profileCompleted = true;

      if (!user.profileBonusClaimed) {
        user.profileBonusClaimed = true;
        
        user.reputation = (user.reputation || 0) + 10;
        
        user.reputationHistory.push({
          action: "Profile Completed",
          points: 10,
          reason: "Completed your profile with all mandatory details",
          createdAt: new Date(),
        });

        // Update privileges
        user.updatePrivileges();
      }

      await user.save();
      return user;
    } catch (error) {
      throw error;
    }
  }

  // ========================
  // Transfer Reputation
  // ========================
  static async transferReputation(senderId, receiverId, points, reason) {
    try {
      // Validation
      if (senderId === receiverId) {
        throw new Error("You cannot transfer reputation to yourself");
      }

      if (points < 1 || points > 50) {
        throw new Error("Points must be between 1 and 50");
      }

      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        throw new Error("User not found");
      }

      // Check sender has enough reputation (minimum 50 to transfer)
      if ((sender.reputation || 0) < 50) {
        throw new Error("You need at least 50 reputation to transfer");
      }

      // Check sender has enough points for this transfer
      if ((sender.reputation || 0) < points) {
        throw new Error(`You don't have enough reputation. You have ${sender.reputation}, need ${points}`);
      }

      // Check daily limit (100 points per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (sender.lastTransferDate && new Date(sender.lastTransferDate) >= today) {
        if ((sender.transferredToday || 0) + points > 100) {
          throw new Error(`Daily transfer limit exceeded. You can transfer up to 100 points per day.`);
        }
      }

      // Perform transfer
      sender.reputation = (sender.reputation || 0) - points;
      receiver.reputation = (receiver.reputation || 0) + points;

      // Update daily transfer counter
      if (!sender.lastTransferDate || new Date(sender.lastTransferDate) < today) {
        sender.transferredToday = 0;
        sender.lastTransferDate = new Date();
      }
      sender.transferredToday = (sender.transferredToday || 0) + points;

      // Add to history for both users
      sender.reputationHistory.push({
        action: "Transfer Sent",
        points: -points,
        reason: reason || "Reputation transfer",
        createdAt: new Date(),
      });

      receiver.reputationHistory.push({
        action: "Transfer Received",
        points: points,
        reason: reason || "Reputation transfer",
        createdAt: new Date(),
      });

      // Add to transfer records
      sender.reputationTransfers.push({
        sender: senderId,
        receiver: receiverId,
        points: points,
        reason: reason || "Reputation transfer",
        createdAt: new Date(),
      });

      receiver.reputationTransfers.push({
        sender: senderId,
        receiver: receiverId,
        points: points,
        reason: reason || "Reputation transfer",
        createdAt: new Date(),
      });

      // Update privileges
      sender.updatePrivileges();
      receiver.updatePrivileges();

      await sender.save();
      await receiver.save();

      return {
        sender: { id: sender._id, reputation: sender.reputation },
        receiver: { id: receiver._id, reputation: receiver.reputation },
      };
    } catch (error) {
      throw error;
    }
  }

  // ========================
  // Get User Privileges
  // ========================
  static async getPrivileges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");

      return {
        reputation: user.reputation,
        canCommentUnrestricted: user.reputation >= 50,
        canEditPosts: user.reputation >= 100,
        canCloseQuestions: user.reputation >= 250,
        canReportContent: user.reputation >= 500,
      };
    } catch (error) {
      throw error;
    }
  }

  // ========================
  // Get Transfer History
  // ========================
  static async getTransferHistory(userId) {
    try {
      const user = await User.findById(userId)
        .populate("reputationTransfers.sender", "name email")
        .populate("reputationTransfers.receiver", "name email");
      
      if (!user) throw new Error("User not found");

      return user.reputationTransfers || [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ReputationService;