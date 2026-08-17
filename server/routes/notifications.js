const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notifications");

// ===================================
// IMPORTANT: Specific routes MUST come before generic routes
// ===================================

// Get unread count (specific route - NO auth)
router.get("/:userId/unread-count", getUnreadCount);

// Mark all as read (specific route)
router.patch("/:userId/mark-all-read", auth, markAllAsRead);

// Get all notifications (generic route - MUST COME LAST)
router.get("/:userId", getNotifications);

// Mark one as read
router.patch("/:id/read", auth, markAsRead);

// Delete notification
router.delete("/:id", auth, deleteNotification);

module.exports = router;