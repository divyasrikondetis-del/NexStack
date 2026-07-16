const Notification = require("../models/Notification");

// ===================================
// Get All Notifications of a User
// ===================================
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .populate("fromUserId", "name email")
      .populate("postId");

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ===================================
// Get Unread Notification Count
// ===================================
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.params.userId,
      read: false,
    });

    res.status(200).json({
      count,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ===================================
// Mark One Notification as Read
// ===================================
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ===================================
// Mark All Notifications as Read
// ===================================
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.params.userId,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ===================================
// Delete Notification
// ===================================
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (err) {
    res.status(500).json({
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