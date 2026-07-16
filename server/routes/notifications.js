const express = require("express");

const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notifications");

// =============================
// Get all notifications
// =============================
router.get("/:userId", getNotifications);

// =============================
// Get unread notification count
// =============================
router.get("/:userId/unread-count", getUnreadCount);

// =============================
// Mark one notification as read
// =============================
router.patch("/:id/read", markAsRead);

// =============================
// Mark all notifications as read
// =============================
router.patch("/:userId/read-all", markAllAsRead);

// =============================
// Delete notification
// =============================
router.delete("/:id", deleteNotification);

module.exports = router;