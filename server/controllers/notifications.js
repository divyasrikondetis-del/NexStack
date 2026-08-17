const Notification = require("../models/Notification");

// ===================================
// Get All Notifications of a User
// ===================================
const getNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("📬 [getNotifications] Fetching for user:", userId);

    const notifications = await Notification.find({ userId })
      .populate("fromUserId", "name email")
      .populate("postId")
      .sort({ createdAt: -1 });

    console.log(`✅ [getNotifications] Found ${notifications.length} notifications`);
    res.status(200).json({
      success: true,
      notifications: notifications
    });
  } catch (err) {
    console.error("❌ [getNotifications] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================================
// Get Unread Notification Count
// ===================================
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("📬 [getUnreadCount] Fetching for user:", userId);

    const count = await Notification.countDocuments({
      userId: userId,
      read: false,
    });

    console.log(`✅ [getUnreadCount] Unread count: ${count}`);
    res.status(200).json({
      success: true,
      count: count,
      unread: count,
    });
  } catch (err) {
    console.error("❌ [getUnreadCount] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================================
// Mark One Notification as Read
// ===================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📬 [markAsRead] Notification ${id}`);

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      console.log("❌ [markAsRead] Notification not found:", id);
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    console.log("✅ [markAsRead] Notification marked as read");
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error("❌ [markAsRead] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================================
// Mark All Notifications as Read
// ===================================
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📬 [markAllAsRead] For user ${userId}`);

    const result = await Notification.updateMany(
      { userId: userId, read: false },
      { read: true }
    );

    console.log(`✅ [markAllAsRead] ${result.modifiedCount} notifications marked as read`);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("❌ [markAllAsRead] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================================
// Delete Notification
// ===================================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📬 [deleteNotification] Notification ${id}`);

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      console.log("❌ [deleteNotification] Notification not found:", id);
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    console.log("✅ [deleteNotification] Notification deleted");
    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    console.error("❌ [deleteNotification] Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};